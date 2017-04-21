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
Lambda function evoked by SNS to execute Publish step functions.
guid used for step execute for tracking
*/
'use strict';
const AWS = require('aws-sdk');
const stepfunctions = new AWS.StepFunctions({
    region: process.env.AWS_REGION
});

exports.handler = (event, context, callback) => {

    var msg = JSON.parse(event.Records[0].Sns.Message);
    console.log(msg);

    let prefix;
    let json;

    if (msg.playlists) {
        prefix = '-hls';
        json = {
            "guid": msg.outputKeyPrefix.slice(0, -1),
            "hlsOutput": msg.outputKeyPrefix.slice(0, -1) + '/' + msg.playlists[0].name,
            "duration": msg.outputs[0].duration.toString()
            };
    }
    else {
        prefix = '-mp4';
        json = {
            "guid": msg.outputKeyPrefix.slice(0, -1),
            "mp4Output":msg.outputKeyPrefix.slice(0, -1) + '/' + msg.outputs[0].key,
            "duration": msg.outputs[0].duration.toString()
            };
    }

    console.log(json);

    var params = {
        stateMachineArn: process.env.PublishStepFunctions,
        input: JSON.stringify(json),
        name: msg.outputKeyPrefix.slice(0, -1) + prefix
    };

    // execute step functions
    stepfunctions.startExecution(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            callback(null, err);
        } else {
            console.log(data);
            callback(null, 'success');
        }
    });
};
