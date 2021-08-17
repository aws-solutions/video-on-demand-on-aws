/*********************************************************************************************************************
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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


exports.handler = async (event) => {
  console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`);

  const sqs = new AWS.SQS({
    region: process.env.AWS_REGION
  });

  try {
    let cmsId = event.hasOwnProperty("cmsId") ? event.cmsId : event.detail.userMetadata.cmsId

    console.log(`SEND SQS:: MessageGroupId: ${cmsId} ; queue = ${process.env.SqsQueue}`);

    let params = {
      MessageBody: JSON.stringify(event),
      MessageGroupId: cmsId,
      QueueUrl: process.env.SqsQueue
    };

    await sqs.sendMessage(params).promise()
      .then(data => console.log("sqs:success", data))
      .catch(err => console.log("sqs:error", err));

  } catch (err) {
    await error.handler(event, err);
    throw err;
  }

  return event;
};
