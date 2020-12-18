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

describe('#ENCODE::', () => {
    process.env.MediaConvertRole = 'Role';
    process.env.Workflow = 'vod';
    process.env.ErrorHandler = 'error_handler';

    const _event = {
        guid: '12345678',
        jobTemplate: 'jobTemplate',
        srcVideo: 'video.mp4',
        srcBucket: 'src',
        destBucket: 'dest',
        acceleratedTranscoding:'PREFERRED'
    };

    const _withframe = {
        guid: '12345678',
        jobTemplate: 'jobTemplate',
        srcVideo: 'video.mp4',
        srcBucket: 'src',
        destBucket: 'dest',
        frameCapture: true,
        acceleratedTranscoding:'ENABLED'
    };

    const data = {
        Job: {
            Id: '12345',
        }
    };

    const tmpl = {
        JobTemplate: {
            Settings: {
                OutputGroups: [
                    {
                        OutputGroupSettings: {
                            Type: 'HLS_GROUP_SETTINGS'
                        },
                        Name: 'test-output-group'
                    }
                ]
            }
        }
    };

    afterEach(() => AWS.restore('MediaConvert'));

    it('should succeed when FrameCapture is disabled', async () => {
        AWS.mock('MediaConvert', 'getJobTemplate', Promise.resolve(tmpl));
        AWS.mock('MediaConvert', 'createJob', Promise.resolve(data));

        const response = await lambda.handler(_event);
        expect(response.encodeJobId).to.equal('12345');
        expect(response.encodingJob.Settings.OutputGroups[0].Name).to.equal('HLS Group');
    });

    it('should succeed when FrameCapture is enabled', async () => {
        AWS.mock('MediaConvert', 'getJobTemplate', Promise.resolve(tmpl));
        AWS.mock('MediaConvert', 'createJob', Promise.resolve(data));

        const response = await lambda.handler(_withframe);
        expect(response.encodeJobId).to.equal('12345');
        expect(response.encodingJob.Settings.OutputGroups[1].CustomName).to.equal('Frame Capture');
    });

    it('should apply custom settings when template is custom', async () => {
        const event = {
            guid: '12345678',
            jobTemplate: 'custom-template',
            srcVideo: 'video.mp4',
            srcBucket: 'src',
            destBucket: 'dest',
            isCustomTemplate: true,
            acceleratedTranscoding:'DISABLED'
        };

        const customTemplate = {
            JobTemplate: {
                Name: 'custom-template',
                Type: 'CUSTOM',
                Settings: {
                    OutputGroups: [{
                        OutputGroupSettings: {
                            Type: 'HLS_GROUP_SETTINGS',
                            HlsGroupSettings: {
                                SegmentLength: 10,
                                MinSegmentLength: 2
                            }
                        },
                        Name: 'custom-output-group'
                    }]
                }
            }
        };

        const newJob = { Job: { Id: '12345678' } };

        AWS.mock('MediaConvert', 'getJobTemplate', Promise.resolve(customTemplate));
        AWS.mock('MediaConvert', 'createJob', Promise.resolve(newJob));

        const response = await lambda.handler(event);

        const output = response.encodingJob.Settings.OutputGroups[0];
        const settings = output.OutputGroupSettings.HlsGroupSettings;

        expect(settings).not.to.be.null;
        expect(settings.SegmentLength).to.equal(5);
        expect(settings.MinSegmentLength).to.equal(0);
    });

    it('should fail when getJobTemplate throws an exception', async () => {
        AWS.mock('MediaConvert', 'getJobTemplate', Promise.reject('GET ERROR'));
        AWS.mock('Lambda', 'invoke', Promise.resolve());

        await lambda.handler(_event).catch(err => {
            expect(err).to.equal('GET ERROR');
        });
    });

    it('should fail when createJob throws an exception', async () => {
        AWS.mock('MediaConvert', 'getJobTemplate', Promise.resolve(tmpl));
        AWS.mock('MediaConvert', 'createJob', Promise.reject('JOB ERROR'));
        AWS.mock('Lambda', 'invoke', Promise.resolve());

        await lambda.handler(_event).catch(err => {
            expect(err).to.equal('JOB ERROR');
        });
    });
});
