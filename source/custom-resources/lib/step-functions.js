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
 **/
'use strict';
const fs = require('fs');
const AWS = require('aws-sdk');

let response;
let definition;

let createPromise = function(event) {
  const stepfunctions = new AWS.StepFunctions({
    region: process.env.AWS_REGION
  });

  response = new Promise((res, reject) => {


    switch (event.LogicalResourceId) {

      case 'IngestWorkflow':

        if (event.ResourceProperties.ValidateMetadata) {
          definition = JSON.stringify({
            "StartAt": "Validate Metadata",
            "States": {
              "Validate Metadata": {
                "Type": "Task",
                "Resource": event.ResourceProperties.ValidateMetadata,
                "Next": "Validate Source"
              },
              "Validate Source": {
                "Type": "Task",
                "Resource": event.ResourceProperties.ValidateSource,
                "Next": "Mediainfo"
              },
              "Mediainfo": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Mediainfo,
                "Next": "Dynamo"
              },
              "Dynamo": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Dynamo,
                "Next": "SNS"
              },
              "SNS": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Sns,
                "Next": "Process Execute"
              },
              "Process Execute": {
                "Type": "Task",
                "Resource": event.ResourceProperties.ProcessExecute,
                "End": true
              }
            }
          });
        } else {
          definition = JSON.stringify({
            "StartAt": "Validate Source",
            "States": {
              "Validate Source": {
                "Type": "Task",
                "Resource": event.ResourceProperties.ValidateSource,
                "Next": "Mediainfo"
              },
              "Mediainfo": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Mediainfo,
                "Next": "Dynamo"
              },
              "Dynamo": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Dynamo,
                "Next": "SNS"
              },
              "SNS": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Sns,
                "Next": "Process Execute"
              },
              "Process Execute": {
                "Type": "Task",
                "Resource": event.ResourceProperties.ProcessExecute,
                "End": true
              }
            }
          });
        }
        break;

      case 'ProcessWorkflow':
        definition = JSON.stringify({
          "StartAt": "profiler",
          "States": {
            "profiler": {
              "Type": "Task",
              "Resource": event.ResourceProperties.Profiler,
              "Next": "Encode HLS"
            },
            "Encode HLS": {
              "Type": "Task",
              "Resource": event.ResourceProperties.EncodeHls,
              "Next": "Encode MP4"
            },
            "Encode MP4": {
              "Type": "Task",
              "Resource": event.ResourceProperties.EncodeMp4,
              "Next": "Encode DASH"
            },
            "Encode DASH": {
              "Type": "Task",
              "Resource": event.ResourceProperties.EncodeDash,
              "Next": "Dynamo"
            },
            "Dynamo": {
              "Type": "Task",
              "Resource": event.ResourceProperties.Dynamo,
              "End": true
            }
          }
        });
        break;

      case 'PublishWorkflow':
        if (event.ResourceProperties.Glacier) {

          definition = JSON.stringify({
            "Comment": "VOD",
            "StartAt": "Validate Outputs",
            "States": {
              "Validate Outputs": {
                "Type": "Task",
                "Resource": event.ResourceProperties.ValidateOutputs,
                "Next": "Dynamo Update"
              },

              "Dynamo Update": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Dynamo,
                "Next": "ETS Job Check"
              },

              "ETS Job Check": {
                "Type": "Task",
                "Resource": event.ResourceProperties.EtsJobCheck,
                "Next": "Status"
              },

              "Status": {
                "Type": "Choice",
                "Choices": [{
                  "Variable": "$.workflowStatus",
                  "StringEquals": "complete",
                  "ResultPath": null,
                  "Next": "Glacier"
                }, {
                  "Variable": "$.workflowStatus",
                  "StringEquals": "encoding",
                  "ResultPath": null,
                  "Next": "Encoding"
                }]
              },
              "Glacier": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Glacier,
                "Next": "Dynamo Status"
              },

              "Dynamo Status": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Dynamo,
                "Next": "Publish"
              },

              "Publish": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Publish,
                "End": true
              },

              "Encoding": {
                "Type": "Pass",
                "End": true
              }
            }
          });

        } else {

          definition = JSON.stringify({
            "Comment": "VOD",
            "StartAt": "Validate Outputs",
            "States": {
              "Validate Outputs": {
                "Type": "Task",
                "Resource": event.ResourceProperties.ValidateOutputs,
                "Next": "Dynamo Update"
              },

              "Dynamo Update": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Dynamo,
                "Next": "ETS Job Check"
              },

              "ETS Job Check": {
                "Type": "Task",
                "Resource": event.ResourceProperties.EtsJobCheck,
                "Next": "Status"
              },

              "Status": {
                "Type": "Choice",
                "Choices": [{
                  "Variable": "$.workflowStatus",
                  "StringEquals": "complete",
                  "ResultPath": null,
                  "Next": "Publish"
                }, {
                  "Variable": "$.workflowStatus",
                  "StringEquals": "encoding",
                  "ResultPath": null,
                  "Next": "Encoding"
                }]
              },
              "Publish": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Publish,
                "Next": "Dynamo Status"
              },

              "Dynamo Status": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Dynamo,
                "End": true
              },

              "Encoding": {
                "Type": "Pass",
                "End": true
              }
            }
          });
        }
        break;

      default:
        reject('error LogicalResourceId not defined');
    }

    let params = {
      definition: definition,
      name: event.ResourceProperties.Name,
      roleArn: event.ResourceProperties.RoleArn
    };

    console.log('Creating workflow: ', JSON.stringify(params, null, 2));
    stepfunctions.createStateMachine(params, function(err, data) {
      if (err) reject(err);
      else {
        let responseData = {
          StepsArn: data.stateMachineArn
        };
        res(responseData);
      }
    });
  });
  return response;
};

let deletePromise = function(event) {
  const stepfunctions = new AWS.StepFunctions({
    region: process.env.AWS_REGION
  });
  response = new Promise((res, reject) => {
    let params = {
      stateMachineArn: event.PhysicalResourceId
    };

    stepfunctions.deleteStateMachine(params, function(err, data) {
      if (err) reject(err);
      else {
        console.log(data)
        res(data);
      }
    });
  });
  return response;
};


module.exports = {
  createSteps: createPromise,
  deleteSteps: deletePromise
};
