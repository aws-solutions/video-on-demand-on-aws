/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const AWS = require('aws-sdk');
const error = require('./lib/error.js');

exports.handler = async (event) => {
    console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`);

    const s3 = new AWS.S3();

    try {
        let params = {
            Bucket: event.srcBucket,
            Key: event.srcVideo,
            Tagging: {
                TagSet: [
                    {
                        Key: 'guid',
                        Value: event.guid
                    },
                    {
                        Key: process.env.AWS_LAMBDA_FUNCTION_NAME.slice(0, -15),
                        Value: event.archiveSource
                    }
                ]
            }
        };

        await s3.putObjectTagging(params).promise();
    } catch (err) {
        await error.handler(event, err);
        return err;
    }

    return event;
};
