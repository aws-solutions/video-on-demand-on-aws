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
Step function: Get mediainfo and create metadata json file.
*/
'use strict';
const child_process = require('child_process');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB({
    region: process.env.AWS_REGION
});

exports.handler = (event, context, callback) => {
    //ets jobs can finsish at the same time for small files (< 100mb)
    child_process.execSync("sleep 8");
    // delay to off set the 2 step functions executions and prevent publish
    // sending SNS completion twice

    var db_get = {
        TableName: process.env.Dynamo,
        Key: {
            "guid": {
                S: event.guid
            }
        }
    };

    dynamodb.getItem(db_get, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            callback(err);
        } else {

            var info = JSON.parse(data.Item.mp4Mediainfo.S);

            var mp4size = info.$container.fileSize.toString();

            var json = {
                "File": event.guid + '/' + event.mp4Output.S,
                "Container": info.$container,
                "Video": info.$videoES,
                "Audio": info.$audioES,
                "Subtitles": info.$textES
            };

            var s3_put = {
                Bucket: process.env.Mp4Dest,
                Key: event.guid + '/' + data.Item.mp4Output.S.slice(0, -4) + '.json',
                Body: JSON.stringify(json, null, 2),
            };

            s3.putObject(s3_put, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    callback(err);
                } else {

                    var db_put = {
                        TableName: process.env.Dynamo,
                        Key: {
                            'guid': {
                                'S': event.guid
                            }
                        },
                        ExpressionAttributeValues: {
                          ':metadata': {
                              S: JSON.stringify(json)
                          },
                          ':size': {
                              S: mp4size
                          }
                        },
                        UpdateExpression: 'SET mp4Metadata = :metadata, mp4Size = :size'
                    };

                    dynamodb.updateItem(db_put, function(err, data) {
                        if (err) {
                            console.log(err, err.stack);
                            callback(err, 'Failed');
                        } else {
                            console.log(data);
                            callback(null, 'Success');
                        }
                    });
                }
            });
        }
    });
};
