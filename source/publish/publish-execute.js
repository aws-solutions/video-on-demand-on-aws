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
const error = require('./lib/error.js');

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const stepfunctions = new AWS.StepFunctions({
        region: process.env.AWS_REGION
    });

    let msg = JSON.parse(event.Records[0].Sns.Message);
    let guid  = msg.userMetadata.guid;
    let preset = msg.userMetadata.preset;
    let execute_id = guid+'-'+preset;

    let input = {
        guid: guid,
        msg: msg,
        preset: preset
    };

    let params = {
        stateMachineArn: process.env.PublishWorkflow,
        input: JSON.stringify(input),
        name: execute_id
    };

    console.log('workflow execute: ',JSON.stringify(input, null, 2));

    stepfunctions.startExecution(params).promise()
      .then(() => callback(null, 'success'))
      .catch(err => {
        error.sns(event, err);
        callback(err);
      });
};
