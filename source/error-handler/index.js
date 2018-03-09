'use strict';
const os = require('os');
const AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const docClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
  });
  const sns = new AWS.SNS({
    region: process.env.AWS_REGION
  });

  let consoleUrl;
  let guid;
  let values;

  if (event.Records) {
    console.log('ETS SNS Error Mesage');
    event = JSON.parse(event.Records[0].Sns.Message);
    console.log('Processing ETS error');
    consoleUrl = 'https://console.aws.amazon.com/elastictranscoder/home?region=' + process.env.AWS_REGION + '#jobs:pipelineId=' + event.pipelineId + ';ascendingOrder=false;numOfJobs=50';
    guid = event.outputKeyPrefix.slice(0, -1);
    values = {
      ":st": "error",
      ":ea": "encoding",
      ":em": JSON.stringify(event, null, 2)
    };


  } else if (event.function) {
    console.log('Workflow Lambda Error');
    consoleUrl = 'https://console.aws.amazon.com/cloudwatch/home?region=' + process.env.AWS_REGION + '#logStream:group=/aws/lambda/' + event.function;
    guid = event.guid;
    values = {
      ":st": "error",
      ":ea": event.function,
      ":em": event.error
    };

  } else {
    console.log('MediaConvert Error');
    consoleUrl = 'https://console.aws.amazon.com/mediaconvert/home?region=' + process.env.AWS_REGION + '#/jobs/summary/' + event.detail.jobId;
    guid = event.detail.userMetadata.guid;
    values = {
      ":st": "error",
      ":ea": "encoding",
      ":em": JSON.stringify(event, null, 2)
    };
  }

  let params = {
    TableName: process.env.DynamoDBTable,
    Key: {
      guid: guid
    },
    UpdateExpression: 'SET workflow_status = :st,' + 'workflow_error_at = :ea,' + 'error_message = :em',
    ExpressionAttributeValues: values
  };

  docClient.update(params).promise()
    .then(() => sns.publish({
      Message: 'Please see the AWS console for detail :' + consoleUrl + os.EOL + JSON.stringify(event, null, 2),
      Subject: ' workflow error: ' + guid,
      TargetArn: process.env.NotificationSns
    }).promise())
    .then(() => callback(null, 'sucess'))
    .catch(err => {
      console.log(err);
      callback(err);
    });
};
