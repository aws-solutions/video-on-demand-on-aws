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

const AWS = require('aws-sdk');
const error = require('./lib/error.js');

const NOT_APPLICABLE_PROPERTIES = [
  'mp4Outputs',
  'mp4Urls',
  'hlsPlaylist',
  'hlsUrl',
  'dashPlaylist',
  'dashUrl',
  'mssPlaylist',
  'mssUrl',
  'cmafDashPlaylist',
  'cmafDashUrl',
  'cmafHlsPlaylist',
  'cmafHlsUrl'
];

exports.handler = async (event) => {
  console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`);

  const sns = new AWS.SNS({
    region: process.env.AWS_REGION
  });

  let msg = {};

  try {
    let subject = `Workflow Status:: ${event.workflowStatus} :: ${event.guid} (${event.cmsId})`;

    if (event.workflowStatus === 'Complete') {
      msg = event;
      delete msg.srcMediainfo;
      delete msg.jobTemplate_1080p;
      delete msg.jobTemplate_720p;
      delete msg.encodingJob;
      delete msg.encodingOutput;

    } else if (event.workflowStatus === 'Ingest') {
      msg = {
        status: event.workflowStatus,
        guid: event.cmsId || event.guid,
        srcVideo: event.srcVideo
      };
    } else {
      throw new Error('Workflow Status not defined.');
    }

    console.log(`SEND SNS:: ${JSON.stringify(event, null, 2)}`);

    let params = {
      Message: JSON.stringify(msg, null, 2),
      Subject: subject,
      TargetArn: process.env.SnsTopic
    };

    await sns.publish(params).promise();
  } catch (err) {
    await error.handler(event, err);
    throw err;
  }

  return event;
};
