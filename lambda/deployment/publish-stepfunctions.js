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
        var params;

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

            var json = JSON.stringify({
                "Comment": "VOD",
                "StartAt": "PresetCheck",
                "States": {
                    "PresetCheck": {
                        "Type": "Task",
                        "Resource": event.ResourceProperties.PresetCheck,
                        "Next": "PublishChoice"
                    },
                    "PublishChoice": {
                        "Type": "Choice",
                        "Choices": [{
                            "Variable": "$.preset",
                            "StringEquals": "mp4Output",
                            "ResultPath": null,
                            "Next": "Mp4 Mediainfo"
                        }, {
                            "Variable": "$.preset",
                            "StringEquals": "hlsOutput",
                            "ResultPath": null,
                            "Next": "HLS Endpoint"
                        }]
                    },
                    "Mp4 Mediainfo": {
                        "Type": "Task",
                        "Resource": event.ResourceProperties.Mediainfo,
                        "ResultPath": null,
                        "Next": "Mp4 Metadata"
                    },
                    "Mp4 Metadata": {
                        "Type": "Task",
                        "Resource": event.ResourceProperties.Metadata,
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
                        "Resource": event.ResourceProperties.Publish,
                        "End": true
                    }
                }
            });

            params = {
                definition: json,
                name: event.ResourceProperties.Name,
                roleArn: event.ResourceProperties.RoleArn
            };

            var responseData;

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
        }};
