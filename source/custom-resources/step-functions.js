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
const response = require('cfn-response');
const AWS = require('aws-sdk');
const stepfunctions = new AWS.StepFunctions({region: process.env.AWS_REGION});

exports.handler = function(event, context) {
  console.log('Received event:', JSON.stringify(event, null, 2));

  if (event.RequestType == "Delete") {
      let params = {
          stateMachineArn: event.PhysicalResourceId
      };
      stepfunctions.deleteStateMachine(params, function(err, data) {
          if (err) {
              console.log(err, err.stack);
              response.send(event, context, response.FAILED);
          } else {
              console.log(data);
              response.send(event, context, response.SUCCESS);
          }
      });
  } else if (event.RequestType == "Create") {
      console.log('Received event:', JSON.stringify(event, null, 2));

      const ingest = JSON.stringify(
        {
          "Comment": "VOD workflow",
          "StartAt": "Source Validate",
          "States": {
            "Source Validate": {
              "Type": "Task",
              "Resource": event.ResourceProperties.SourceValidate,
              "ResultPath": null,
              "Next": "Mediainfo"
            },
            "Mediainfo": {
              "Type": "Task",
              "Resource": event.ResourceProperties.Mediainfo,
              "ResultPath": null,
              "Next": "Ingest SNS"
            },
            "Ingest SNS": {
              "Type": "Task",
              "Resource": event.ResourceProperties.IngestSns,
              "ResultPath": null,
              "Next": "Process Execute"
            },
            "Process Execute": {
              "Type": "Task",
              "Resource": event.ResourceProperties.ProcessExecute,
              "ResultPath": null,
              "End": true
            }
          }
        }
      );

      const process = JSON.stringify(
        {
        	"Comment": "VOD workflow",
        	"StartAt": "Profiler",
        	"States": {
        		"Profiler": {
        			"Type": "Task",
        			"Resource": event.ResourceProperties.Profiler,
        			"Next": "Encode MP4"
        		},
        		"Encode MP4": {
        			"Type": "Task",
        			"Resource": event.ResourceProperties.EncodeMp4,
        			"ResultPath": null,
              "Next": "Encode HLS"
        		},
        		"Encode HLS": {
        			"Type": "Task",
        			"Resource": event.ResourceProperties.EncodeHls,
        			"ResultPath": null,
              "End": true
        		}
        	}
        }
      );

      const publish = JSON.stringify(
        {
          "Comment": "VOD",
          "StartAt": "Output Validate",
          "States": {
            "Output Validate": {
                "Type": "Task",
                "Resource": event.ResourceProperties.OutputValidate,
                "ResultPath": null,
                "Next": "Preset Choice"
            },
            "Preset Choice": {
                "Type": "Choice",
                "Choices": [{
                    "Variable": "$.preset",
                    "StringEquals": "mp4",
                    "ResultPath": null,
                    "Next": "Mediainfo"
                }, {
                    "Variable": "$.preset",
                    "StringEquals": "hls",
                    "ResultPath": null,
                    "Next": "HLS Endpoint"
                }]
            },
            "Mediainfo": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Mediainfo,
                "ResultPath": null,
                "Next": "Mp4 Metadata"
            },
            "Mp4 Metadata": {
                "Type": "Task",
                "Resource": event.ResourceProperties.Mp4Metadata,
                "ResultPath": null,
                "Next": "Publish SNS"
            },
            "HLS Endpoint": {
                "Type": "Task",
                "Resource": event.ResourceProperties.HlsEndpoint,
                "ResultPath": null,
                "Next": "Publish SNS"
            },
            "Publish SNS": {
                "Type": "Task",
                "Resource": event.ResourceProperties.PublishSns,
                "End": true
            }
          }
        }
      );

      let params = {
        definition:eval(event.ResourceProperties.Workflow),
        name: event.ResourceProperties.Name,
        roleArn: event.ResourceProperties.RoleArn
      };
      console.log('Creating workflow: ', JSON.stringify(params, null, 2));
      stepfunctions.createStateMachine(params, function(err, data) {
          if (err) {
              console.log(err, err.stack);
              response.send(event, context, response.FAILED);
          } else {
              let responseData = {
                  StepsArn: data.stateMachineArn
              };
              response.send(event, context, response.SUCCESS, responseData, data.stateMachineArn);
          }
      });
  }
};
