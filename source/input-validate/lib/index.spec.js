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

const expect = require('chai').expect;
const path = require('path');
const AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const lambda = require('../index.js');

describe('#INPUT VALIDATE::', () => {
    process.env.ErrorHandler = 'error_handler';
    process.env.FrameCapture = 'true';
    process.env.ArchiveSource = 'true';
    process.env.Source = 'source_bucket';
    process.env.EnableMediaPackage = 'true';
    process.env.InputRotate = 'DEGREE_0';
    process.env.AcceleratedTranscoding = 'DISABLED'
    process.env.EnableSns = 'true';
    process.env.EnableSqs = 'true';

    const _video = {
        workflowTrigger: 'Video',
        guid: '1234-1223232-212121',
        Records: [{
            s3: {
                object: {
                    key: 'video.mp4'
                }
            }
        }]
    };

    const _json = {
        workflowTrigger: 'Metadata',
        guid: '1234-1223232-212121',
        Records: [{
            s3: {
                object: {
                    key: 'metadata.json'
                }
            }
        }]
    };

    afterEach(() => AWS.restore('S3'));

    it('should succeed when processing valid source video', async () => {
        const response = await lambda.handler(_video);
        expect(response.srcVideo).to.equal('video.mp4');
    });

    it('should succeed when processing valid metadata', async () => {
        const validMetadata = {
            "Body": '{"srcVideo": "video_from_json.mp4", "archiveSource": false, "frameCapture": false, "srcBucket": "other-source", "jobTemplate_720p": "other-template"}'
        };

        AWS.mock('S3', 'getObject', Promise.resolve(validMetadata));
        AWS.mock('S3', 'headObject', Promise.resolve());

        const response = await lambda.handler(_json);
        expect(response.srcVideo).to.equal('video_from_json.mp4');
        expect(response.archiveSource).to.be.false;
        expect(response.frameCapture).to.be.false;
        expect(response.srcBucket).to.equal('other-source');
        expect(response.jobTemplate_720p).to.equal('other-template');
        expect(response.enableMediaPackage).to.be.true;
        expect(response.inputRotate).to.equal('DEGREE_0');
    });

    it('should always use MediaPackage env variable', async () => {
        const metadata = {
            "Body": '{"srcVideo": "video_from_json.mp4", "enableMediaPackage": false }'
        };

        AWS.mock('S3', 'getObject', Promise.resolve(metadata));
        AWS.mock('S3', 'headObject', Promise.resolve());

        const response = await lambda.handler(_json);
        expect(response.enableMediaPackage).to.be.true;
    });

    it('should correctly handle metadata in PascalCase', async () => {
        const invalidMetadata = {
            "Body": '{"srcVideo": "video_from_json.mp4", "ArchiveSource": false, "FrameCapture": false, "SrcBucket": "other-source", "inputRotate": "AUTO" }'
        };

        AWS.mock('S3', 'getObject', Promise.resolve(invalidMetadata));
        AWS.mock('S3', 'headObject', Promise.resolve());

        const response = await lambda.handler(_json);
        expect(response.srcVideo).to.equal('video_from_json.mp4');
        expect(response.archiveSource).to.be.false;
        expect(response.frameCapture).to.be.false;
        expect(response.srcBucket).to.equal('other-source');
        expect(response.inputRotate).to.equal('AUTO');
    });

    it('should fail when getting object from S3 throws an exception', async () => {
        AWS.mock('S3', 'getObject', Promise.reject('S3 GET ERROR'));
        AWS.mock('S3', 'headObject', Promise.resolve());
        AWS.mock('Lambda', 'invoke', Promise.resolve());

        await lambda.handler(_json).catch(err => expect(err).to.equal('S3 GET ERROR'));
    });
});
