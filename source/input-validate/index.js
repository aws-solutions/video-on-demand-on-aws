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

const moment = require('moment');
const AWS = require('aws-sdk');
const error = require('./lib/error');

exports.handler = async (event) => {
    console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`);

    const s3 = new AWS.S3();
    let data;

    try {
        // Default configuration for the workflow is built using the enviroment variables.
        // Any parameter in config can be overwriten using a metadata file.
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
            archiveSource:  process.env.ArchiveSource,
            jobTemplate_2160p: process.env.MediaConvert_Template_2160p,
            jobTemplate_1080p: process.env.MediaConvert_Template_1080p,
            jobTemplate_720p: process.env.MediaConvert_Template_720p,
            inputRotate: process.env.InputRotate,
            acceleratedTranscoding: process.env.AcceleratedTranscoding,
            enableSns:JSON.parse(process.env.EnableSns),
            enableSqs:JSON.parse(process.env.EnableSqs)
        };

        switch (event.workflowTrigger) {
            case 'Metadata':
                console.log('Validating Metadata file::');

                const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
                data.srcMetadataFile = key;

                // Download json metadata file from s3
                const metadata = await s3.getObject({ Bucket: data.srcBucket, Key: key }).promise();

                const metadataFile = JSON.parse(metadata.Body);
                if (!metadataFile.srcVideo) {
                    throw new Error('srcVideo is not defined in metadata::', metadataFile);
                }

                // https://github.com/awslabs/video-on-demand-on-aws/pull/23
                // Normalize key in order to support different casing
                Object.keys(metadataFile).forEach((key) => {
                    const normalizedKey = key.charAt(0).toLowerCase() + key.substr(1);
                    data[normalizedKey] = metadataFile[key];
                });

                // Check source file is accessible in s3
                await s3.headObject({ Bucket: data.srcBucket, Key: data.srcVideo }).promise();

                break;

            case 'Video':
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
