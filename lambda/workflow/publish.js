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
Step function: Check if both Mp4 and HLS content has been processed
update dynamo and then publish to SNS with the asset details form
Dynamo
*/
'use strict';
const moment = require('moment');
const AWS = require('aws-sdk');
const child_process = require('child_process');
const dynamodb = new AWS.DynamoDB({
    region: process.env.AWS_REGION
});
const sns = new AWS.SNS({
    region: process.env.AWS_REGION
});

exports.handler = (event, context, callback) => {
    var db_get = {
        TableName: process.env.Dynamo,
        Key: {
            "guid": {
                S: event.guid
            }
        }
    };

    var getDynamo = new Promise(
        function(res, reject) {
            dynamodb.getItem(db_get, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    reject(Error("Failed"));
                } else if (data.Item.mp4Output && data.Item.hlsOutput) {
                  //ets jobs finsish at the same time for small files (< 20mb)
                  child_process.execSync("sleep 3");
                  // delay to ensure Db writes are completed for both outputs
                    var db_update = {
                        TableName: process.env.Dynamo,
                        Key: {
                            "guid": {
                                S: event.guid
                            }
                        },
                        ExpressionAttributeValues: {
                            ':status': {
                                S: "Complete"
                            },
                            ':time': {
                                S: moment().utc().format('YYYY-MM-DD HH:mm:ss.S')
                            }
                        },
                        UpdateExpression: 'SET workflowStatus = :status,' + 'completeTime = :time'
                    };

                    dynamodb.updateItem(db_update, function(err, data) {
                        if (err) {
                            console.log(err, err.stack);
                        } else(
                            res("Complete")
                        )
                    });
                } else {
                    res("Encoding");
                }
            });
        }
    );

    getDynamo.then(
        function(res) {
            if (res == "Complete") {
                console.log('HLS and MP4 Encoding complete');
                dynamodb.getItem(db_get, function(err, data) {
                    var json = {
                        "guid": data.Item.guid.S,
                        "profile": data.Item.profile.S,
                        "srcBucket": data.Item.srcBucket.S,
                        "mp4Bucket": data.Item.mp4Bucket.S,
                        "hlsBucket": data.Item.hlsBucket.S,
                        "srcVideo": data.Item.srcVideo.S,
                        "srcSize": data.Item.srcSize.S,
                        "mp4Output": data.Item.guid.S + '/' + data.Item.mp4Output.S,
                        "mp4Size": data.Item.mp4Size.S,
                        "mp4Metadata": data.Item.guid.S + '/' + data.Item.mp4Output.S.slice(0, -3) + 'json',
                        "hlsOutput": data.Item.guid.S + '/' + data.Item.hlsOutput.S,
                        "hlsUrl": data.Item.hlsUrl.S,
                        "startTime": data.Item.startTime.S,
                        "completeTime": data.Item.completeTime.S
                    };

                    var sns_params = {
                        Message: JSON.stringify(json, null, 2),
                        Subject: ': VOD Workflow Complete:' + event.guid,
                        TargetArn: process.env.StepsPublish
                    };

                    sns.publish(sns_params, function(err, data) {
                        if (err) {
                            console.log(err, err.stack);
                            callback(err, 'Failed');
                        } else {
                            console.log(data);
                            // if anonymous send metrics (data)
                        }
                    });
                });
            } else {
                console.log("1 oustanding encode job remaining");
            }
            callback(null, 'Success');
        },
        function(err) {
            console.log(err);
            callback(err, 'Failed');
        }
    );
};
