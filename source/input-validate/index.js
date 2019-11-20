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

const moment = require('moment');
const AWS = require('aws-sdk');
const error = require('./lib/error');

exports.handler = async (event) => {
    console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`);

    const s3 = new AWS.S3();
    let data;
    let params;

    try {
        // Default configuration for the workflow is built using the enviroment variables.
        // Any parameter in config can be overwriten using an metadata file or API call.
        data = {
            guid: event.guid,
            startTime: moment().utc().toISOString(),
            workflowTrigger: event.workflowTrigger,
            workflowStatus: 'Ingest',
            workflowName: process.env.WorkflowName,
            srcBucket: process.env.Source,
            destBucket: process.env.Destination,
            cloudFront: process.env.CloudFront,
            frameCapture: JSON.parse(process.env.FrameCapture),
            archiveSource: JSON.parse(process.env.ArchiveSource),
            jobTemplate_2160p: process.env.MediaConvert_Template_2160p,
            jobTemplate_1080p: process.env.MediaConvert_Template_1080p,
            jobTemplate_720p: process.env.MediaConvert_Template_720p,

            // https://github.com/awslabs/video-on-demand-on-aws/pull/27
            // Rotation support
            inputRotate: process.env.InputRotate
        };

        switch (event.workflowTrigger) {
            case 'Metadata':
                // Parse Metadata File
                console.log('Validating Metadata file::');
                let key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
                data.srcMetadataFile = key;

                // Download json metadata file from s3
                params = {
                    Bucket: data.srcBucket,
                    Key: key
                };

                let metadata = await s3.getObject(params).promise();
                let metadataFile = JSON.parse(metadata.Body);

                // Check metadata for srcVideo
                if (!metadataFile.srcVideo) throw new Error('srcVideo is not defined in metadata::', metadataFile);

                // https://github.com/awslabs/video-on-demand-on-aws/pull/23
                // Normalize key in order to support different casing
                Object.keys(metadataFile).forEach((key) => {
                    let normalizedKey = key.charAt(0).toLowerCase() + key.substr(1);
                    data[normalizedKey] = metadataFile[key];
                });

                // Check source file is accessible in s3
                params = {
                    Bucket: data.srcBucket,
                    Key: data.srcVideo
                };

                await s3.headObject(params).promise();
                break;

            case 'Video':
                // Updating config with source video and data
                data.srcVideo = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
                break;

            default:
                throw new Error('event.workflowTrigger is not defined.');
        }

        // The MediaPackage setting is configured at the stack level, and it cannot be updated via metadata.
        data['enableMediaPackage'] = JSON.parse(process.env.EnableMediaPackage);
    } catch (err) {
        await error.handler(event, err);
        throw err;
    }

    return data;
};
