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
Step function: check if input is HLS or Mp4, update Dynamo and
generate new input json for publish step functions
*/
'use strict';
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({
    region: process.env.AWS_REGION
});

exports.handler = (event, context, callback) => {

    let json = event;
    let preset;
    let time;
    let output;

    if (event.mp4Output) {
        preset = 'mp4Output';
        time = 'mp4EncodeTime';
        output = event.mp4Output;
        json.preset = preset;
    }
    else {
        preset = 'hlsOutput';
        time = 'hlsEncodeTime';
        output = event.hlsOutput + '.m3u8';
        json.preset = preset;
    }

    let params = {
        TableName: process.env.Dynamo,
        Key: {
            'guid': {'S': event.guid}
        },
        ExpressionAttributeValues: {
            ':output': { S: output },
            ':duration': { S: event.duration}
        },
        UpdateExpression: 'SET ' + preset + ' = :output, ' + time + ' = :duration'
    };

    // Store output file path  Dynamo
    dynamodb.updateItem(params, function(err, data) {
        if (err) {
          console.log(err, err.stack);
          callback(null, err);
        }
        else {
          console.log('ets output added to Dynamo');
          callback(null, json);
        }
    });

};
