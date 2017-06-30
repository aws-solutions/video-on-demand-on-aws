/*********************************************************************************************************************
 *  Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance        *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://aws.amazon.com/asl/                                                                                    *
 *                                                                                                                    *
 *  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

/**
 * @author Solution Builders
 */
'use strict';
const AWS = require('aws-sdk');
const stepfunctions = new AWS.StepFunctions({region: process.env.AWS_REGION});

exports.handler = (event, context, callback) => {

  let msg = JSON.parse(event.Records[0].Sns.Message);
  let guid = msg.outputKeyPrefix.slice(0, -1);
  let duration = msg.outputs[0].duration.toString();
  let execute_id;
  let json;
  console.log(JSON.stringify(msg, null, 2));

  if (msg.playlists) {
    execute_id = guid +'-hls';
    json = {
      "guid": guid,
      "output": msg.outputKeyPrefix.slice(0, -1) + '/' + msg.playlists[0].name + '.m3u8',
      "preset":"hls",
      "duration":duration
    };
  }
  else {
    execute_id = guid + '-mp4';
    json = {
        "guid": guid,
        "output":msg.outputKeyPrefix.slice(0, -1) + '/' + msg.outputs[0].key,
        "preset":"mp4",
        "duration":duration
    };
  }

  console.log(JSON.stringify(json, null, 2));

  let params = {
      stateMachineArn: process.env.PublishWorkflow,
      input: JSON.stringify(json),
      name: execute_id
  };

  // execute step functions
  stepfunctions.startExecution(params, function(err, data) {
      if (err) {
          console.log(err, err.stack);
          callback(err);
      } else {
          console.log(data);
          callback(null, 'success');
      }
  });
};
