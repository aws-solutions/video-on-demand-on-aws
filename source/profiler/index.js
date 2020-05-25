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

    const dynamo = new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION
    });

    try {
        // Download DynamoDB data for the source file:
        let params = {
            TableName: process.env.DynamoDBTable,
            Key: {
                guid: event.guid
            }
        };

        let data = await dynamo.get(params).promise();

        Object.keys(data.Item).forEach(key => {
            event[key] = data.Item[key];
        });

        let mediaInfo = JSON.parse(event.srcMediainfo);
        event.srcHeight = mediaInfo.video[0].height;
        event.srcWidth = mediaInfo.video[0].width;

        // Determine encoding by matching the srcHeight to the nearest profile.
        const profiles = [2160, 1080, 720];
        let lastProfile;
        let encodeProfile;

        profiles.some(p => {
            let profile = Math.abs(event.srcHeight - p);
            if (profile > lastProfile) {
                return true;
            }

            encodeProfile = p;
            lastProfile = profile;
        });

        event.encodingProfile = encodeProfile;

        if (event.frameCapture) {
            // Match Height x Width with the encoding profile.
            const ratios = {
                '2160': 3840,
                '1080': 1920,
                '720': 1280
            };

            event.frameCaptureHeight = encodeProfile;
            event.frameCaptureWidth = ratios[encodeProfile];
        }

        // Update:: added support to pass in a custom encoding Template instead of using the
        // solution defaults
        if (!event.jobTemplate) {
            // Match the jobTemplate to the encoding Profile.
            const jobTemplates = {
                '2160': event.jobTemplate_2160p,
                '1080': event.jobTemplate_1080p,
                '720': event.jobTemplate_720p
            };

            event.jobTemplate = jobTemplates[encodeProfile];
            console.log(`Chosen template:: ${event.jobTemplate}`);

            event.isCustomTemplate = false;
        } else {
            event.isCustomTemplate = true;
        }
    } catch (err) {
        await error.handler(event, err);
        throw err;
    }

    console.log(`RESPONSE:: ${JSON.stringify(event, null, 2)}`);
    return event;
};
