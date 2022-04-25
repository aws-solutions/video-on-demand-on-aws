/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const axios = require('axios');
const AWS = require('aws-sdk');
const logger = require('./lib/logger');

const send_slack = async (guid, msg, url) => {
  await Promise.all(process.env.SlackHook.split(",").map(async hook => {
    return await axios.post(hook, {
      "blocks": [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": `☠📼☠ Workflow Status:: Error: ${guid} ☠📼☠`,
            "emoji": true
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*Message:*\n\`\`\`${JSON.stringify(msg, null, 2)}\`\`\``
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*URLs:*\n- <${url}|AWS Details>\n- <https://editor-production.livingdocs.stroeerws.de/p/t-online/media-library/${guid}|LivingDocs Details>`
          }
        }
      ]
    });
  }));
};

const send_ops_genie = async (msg) => {
  let alert_exists;
  try {
    const list_response = await axios.get(`https://api.opsgenie.com/v2/alerts/${msg.guid}`,
      {
        params: {identifierType: 'alias'},
        headers: {'Authorization': `GenieKey ${process.env.GenieKey}`}
      }
    );
    alert_exists = list_response.status === 200;
  } catch (e) {
    if (e.response.status === 404) {
      alert_exists = false;
    } else {
      throw e;
    }
  }

  if (alert_exists && msg.workflowStatus === 'SUCCEEDED') {
    // close alert
    logger.info(`closing open alert for id=${msg.guid}`);
    return axios.post(`https://api.opsgenie.com/v2/alerts/${msg.guid}/close`, {
        user: 'buzzhub',
        source: 'error-handler',
        note: msg.errorMessage
      },
      {
        params: {identifierType: 'alias'},
        headers: {Authorization: `GenieKey ${process.env.GenieKey}`}
      });
  }
  if (!alert_exists && ["ABORTED", "TIMED_OUT", "FAILED"].includes(msg.workflowStatus)) {
    // create alert
    logger.info(`creating open alert for id=${msg.guid}`);
    return axios.post('https://api.opsgenie.com/v2/alerts', {
      alias: msg.guid,
      priority: 'P1',
      message: msg.errorMessage,
      description: msg.errorMessage,
      details: Object.fromEntries(['guid', 'workflowStatus', 'workflowErrorAt'].map(k => [k, msg[k]])),
      user: "buzzhub",
      source: "error-handler"
    }, {headers: {'Authorization': `GenieKey ${process.env.GenieKey}`}});
  }

  return Promise.resolve("noop");
};

exports.handler = async (event) => {
  logger.registerEvent(event);
  logger.info("REQUEST", event);

  const dynamo = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
  });

  const sns = new AWS.SNS({
    region: process.env.AWS_REGION
  });

  let guid, values, url, msg;

  if (event.source !== 'aws.states') {
    if (event.function) {
      url = 'https://console.aws.amazon.com/cloudwatch/home?region=' + process.env.AWS_REGION + '#logStream:group=/aws/lambda/' + event.function;
      guid = event.cmsId || event.guid;
      values = {
        ':st': 'Error',
        ':ea': event.function,
        ':em': event.error,
        ':ed': url
      };

      // Msg update to match DynamoDB entry
      msg = {
        guid: guid,
        workflowStatus: 'Error',
        workflowErrorAt: event.function,
        errorMessage: event.error,
        errorDetails: url
      };
    }

    if (event.detail) {
      url = 'https://console.aws.amazon.com/mediaconvert/home?region=' + process.env.AWS_REGION + '#/jobs/summary/' + event.detail.jobId;
      guid = event.detail.userMetadata.cmsId || event.detail.userMetadata.guid;
      values = {
        ':st': 'Error',
        ':ea': 'Encoding',
        ':em': JSON.stringify(event, null, 2),
        ':ed': url
      };

      // Msg update to match DynamoDB entry
      msg = {
        guid: guid,
        workflowStatus: 'Error',
        workflowErrorAt: 'Encoding',
        errorMessage: event.detail.errorMessage,
        userMetadata: event.detail.userMetadata,
        errorDetails: url
      };
    }
  } else if (event.source === 'aws.states') {
    // step function error
    url = `https://${process.env.AWS_REGION}.console.aws.amazon.com/states/home?region=${process.env.AWS_REGION}#/executions/details/${event?.detail?.executionArn || ""}`;
    const input = JSON.parse(event.detail.input ?? "{}");
    const userMetadata = input?.detail?.userMetadata ?? {};
    guid = userMetadata?.cmsId ?? input?.cmsId ?? event.guid;
    values = {
      ':st': event.detail.status,
      ':ea': 'StepFunction',
      ':em': JSON.stringify(event, null, 2),
      ':ed': url
    };

    // Msg update to match DynamoDB entry
    msg = {
      guid: guid,
      workflowStatus: event.detail.status,
      workflowErrorAt: 'StepFunction',
      errorMessage: `buzzhub workflow ${guid} terminated with state ${event.detail.status}`,
      userMetadata: userMetadata,
      errorDetails: url
    };

  }

  logger.info({msg});

  if (["ABORTED", "TIMED_OUT", "FAILED", 'Error'].includes(msg.workflowStatus)) {

    // Update DynamoDB
    let params = {
      TableName: process.env.DynamoDBTable,
      Key: {guid: guid},
      UpdateExpression: 'SET workflowStatus = :st,' + 'workflowErrorAt = :ea,' + 'errorMessage = :em,' + 'errorDetails = :ed',
      ExpressionAttributeValues: values
    };

    try { await dynamo.update(params).promise();} catch (e) {
      logger.error("Error updating dynamodb.", e);
      // throw e;
    }

    // Feature/so-vod-173 match SNS data structure with the SNS Notification
    // Function for consistency.
    params = {
      Message: JSON.stringify(msg, null, 2),
      Subject: `Workflow Status:: Error: ${guid}`,
      TargetArn: process.env.SnsTopic
    };

    try { await sns.publish(params).promise();} catch (e) {
      logger.error("Error publishing to SNS.", e);
      // throw e;
    }

    try { await send_slack(guid, msg, url); } catch (e) {
      logger.error('Error publishing to Slack webhook.', e);
    }
  }

  try { logger.info((await send_ops_genie(msg)).data); } catch (e) {
    logger.error('Error publishing to OpsGenie.', e);
  }


  return event;
};
