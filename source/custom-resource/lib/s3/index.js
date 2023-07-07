/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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

const { S3 } = require("@aws-sdk/client-s3");

/**
  * 
  * Helper function to create S3 ObjectCreated event handler
  * 
  * @param {string} lambdaArn - ARN of the Lambda function to be invoked
  * @param {string} suffix  - Object suffix to filter event
  * @returns 
  */
const getS3ObjectCreatedHandlerConfig = (lambdaArn, suffix) => ({
    Events: ['s3:ObjectCreated:*'],
    LambdaFunctionArn: lambdaArn,
    Filter: {
        Key: {
            FilterRules: [{
                Name: 'suffix',
                Value: suffix
            }]
        }
    }
})

/**
  * Add event notifications to the source S3 bucket
 */
let PutNotification = async (config) => {
    const s3 = new S3({customUserAgent: process.env.SOLUTION_IDENTIFIER});

    let params;

    switch (config.WorkflowTrigger) {
        case 'VideoFile':
            const suffixList = [
                '.mpg',
                '.mp4',
                '.m4v',
                '.mov',
                '.m2ts',
                '.wmv',
                '.mxf',
                '.mkv',
                '.m3u8',
                '.mpeg',
                '.webm',
                '.h264'
            ];

            params = {
                Bucket: config.Source,
                NotificationConfiguration: {
                    LambdaFunctionConfigurations: suffixList.map(suffix => ([
                        getS3ObjectCreatedHandlerConfig(config.IngestArn, suffix),
                        getS3ObjectCreatedHandlerConfig(config.IngestArn, suffix.toUpperCase())
                    ])).flat()
                }
            };

            console.log(`Configuring S3 event for ${config.WorkflowTrigger}`);
            await s3.putBucketNotificationConfiguration(params);
            break;

        case 'MetadataFile':
            params = {
                Bucket: config.Source,
                NotificationConfiguration: {
                    LambdaFunctionConfigurations: [ getS3ObjectCreatedHandlerConfig(config.IngestArn, 'json') ]
                }
            };

            console.log(`Configuring S3 event for ${config.WorkflowTrigger}`);
            await s3.putBucketNotificationConfiguration(params);
            break;

        default:
            throw new Error(`Unknown WorkflowTrigger: ${config.WorkflowTrigger}`);
    }

    return 'success';
};

module.exports = {
    putNotification: PutNotification
};
