/*********************************************************************************************************************
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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
const moment = require('moment');

const buildUrl = (originalValue) => originalValue.slice(5).split('/').splice(1).join('/');

exports.handler = async (event) => {
    console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`);

    const dynamo = new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION
    });

    let data = {};

    try {
        // Get Config from DynamoDB (data required for the workflow)
        let params = {
            TableName: process.env.DynamoDBTable,
            Key: {
                guid: event.detail.userMetadata.guid,
            }
        };

        data = await dynamo.get(params).promise();
        data = data.Item;

        data.encodingOutput = event;
        data.workflowStatus = 'Complete';
        data.endTime = moment().utc().toISOString();

        // Parse MediaConvert Output and generate CloudFront URLS.
        event.detail.outputGroupDetails.forEach(output => {
            console.log(`${output.type} found in outputs`);

            switch (output.type) {
                case 'HLS_GROUP':
                    data.hlsPlaylist = output.playlistFilePaths[0];
                    data.hlsUrl = `https://${data.cloudFront}/${buildUrl(data.hlsPlaylist)}`;

                    break;

                case 'DASH_ISO_GROUP':
                    data.dashPlaylist = output.playlistFilePaths[0];
                    data.dashUrl = `https://${data.cloudFront}/${buildUrl(data.dashPlaylist)}`;

                    break;

                case 'FILE_GROUP':
                    let files = [];
                    let urls = [];

                    output.outputDetails.forEach((file) => {
                        files.push(file.outputFilePaths[0]);
                        urls.push(`https://${data.cloudFront}/${buildUrl(file.outputFilePaths[0])}`);
                    });

                    if (files[0].split('.').pop() === 'mp4') {
                        data.mp4Outputs = files;
                        data.mp4Urls = urls;
                    }

                    if (files[0].split('.').pop() === 'jpg') {
                        data.thumbNail = files;
                        data.thumbNailUrl = urls;
                    }

                    break;

                case 'MS_SMOOTH_GROUP':
                    data.mssPlaylist = output.playlistFilePaths[0];
                    data.mssUrl = `https://${data.cloudFront}/${buildUrl(data.mssPlaylist)}`;

                    break;

                case 'CMAF_GROUP':
                    data.cmafDashPlaylist = output.playlistFilePaths[0];
                    data.cmafDashUrl = `https://${data.cloudFront}/${buildUrl(data.cmafDashPlaylist)}`;

                    data.cmafHlsPlaylist = output.playlistFilePaths[1];
                    data.cmafHlsUrl = `https://${data.cloudFront}/${buildUrl(data.cmafHlsPlaylist)}`;

                    break;

                default:
                    throw new Error('Could not parse MediaConvert output');
            }
        });
    } catch (err) {
        await error.handler(event, err);
        throw err;
    }

    return data;
};
