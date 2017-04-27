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

/*
Cloudformation custom resource to deploy Step Functions
*/
'use strict';
const response = require('cfn-response');
const AWS = require('aws-sdk');
const stepfunctions = new AWS.StepFunctions({
    region: process.env.AWS_REGION
});

exports.handler = function(event, context) {
  console.log('Received event:', JSON.stringify(event, null, 2));
  var params = '';
  if (event.RequestType == "Delete") {
      params = {
          stateMachineArn: event.PhysicalResourceId
      };
      stepfunctions.deleteStateMachine(params, function(err, data) {
          if (err) {
              console.log(err, err.stack);
              responseData = err;
              response.send(event, context, response.FAILED, responseData);
          } else {
              console.log(data);
              response.send(event, context, response.SUCCESS);
          }
      });
  } else if (event.RequestType == "Create") {
      console.log(event);

      var json = JSON.stringify({
          "Comment": "An example of the Amazon States Language using a choice state.",
          "StartAt": "Dynamo Entry",
          "States": {
              "Dynamo Entry": {
                  "Type": "Task",
                  "Resource": event.ResourceProperties.DynamoEntry,
                  "ResultPath": null,
                  "Next": "Mediainfo"
              },
              "Mediainfo": {
                  "Type": "Task",
                  "Resource": event.ResourceProperties.Mediainfo,
                  "ResultPath": null,
                  "Next": "Profiler"
              },
              "Profiler": {
                  "Type": "Task",
                  "Resource": event.ResourceProperties.Profiler,
                  "Next": "Encode"
              },

              "Encode": {
                  "Type": "Parallel",
                  "Next": "Status Update",
                  "Branches": [{
                      "StartAt": "Encode MP4",
                      "States": {
                          "Encode MP4": {
                              "Type": "Task",
                              "Resource": event.ResourceProperties.EncodeMp4,
                              "ResultPath": null,
                              "End": true
                          }
                      }
                  }, {
                      "StartAt": "Encode HLS",
                      "States": {
                          "Encode HLS": {
                              "Type": "Task",
                              "Resource": event.ResourceProperties.EncodeHls,
                              "ResultPath": null,
                              "End": true
                          }
                      }
                  }]
              },
              "Status Update": {
                  "Type": "Task",
                  "InputPath": "$.[0]",
                  "Resource": event.ResourceProperties.StatusUpdate,
                  "End": true
              }
          }
      });

      params = {
          definition: json,
          name: event.ResourceProperties.Name,
          roleArn: event.ResourceProperties.RoleArn
      };
      var responseData = '';
      stepfunctions.createStateMachine(params, function(err, data) {
          if (err) {
              console.log(err, err.stack);
              responseData = err;
              response.send(event, context, response.FAILED, responseData);
          } else {
              responseData = {
                  StepsArn: data.stateMachineArn
              };
              response.send(event, context, response.SUCCESS, responseData, data.stateMachineArn);
          }
      });
  }
};
