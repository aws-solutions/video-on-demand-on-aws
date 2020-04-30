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

describe('#SNS::', () => {
    const _ingest = {
        guid: '12345678',
        startTime: 'now',
        srcVideo: 'video.mp4',
        workflowStatus: 'Ingest'
    };

    const _publish = {
        guid: '12345678',
        startTime: 'now',
        srcVideo: 'video.mp4',
        workflowStatus: 'Complete',
        jobTemplate_720p: 'jobTemplate_720p',
        jobTemplate_1080p: 'jobTemplate_1080p',
        jobTemplate_2160p: 'jobTemplate_1080p'
    };

    const _error = {
        guid: '12345678',
        startTime: 'now',
        srcVideo: 'video.mp4',
    };

    process.env.ErrorHandler = 'error_handler';

    afterEach(() => AWS.restore('SNS'));

    it('should return "Ingest" on sns ingest notification success', async () => {
        AWS.mock('SNS', 'publish', Promise.resolve());

        const response = await lambda.handler(_ingest);
        expect(response.workflowStatus).to.equal('Ingest');
    });

    it('should return "Complete" on sns Publish notification success', async () => {
        AWS.mock('SNS', 'publish', Promise.resolve());

        const response = await lambda.handler(_publish);
        expect(response.workflowStatus).to.equal('Complete');
    });

    it('should remove properties when MediaPackage is enabled', async() => {
        AWS.mock('SNS', 'publish', Promise.resolve());

        const event = {
            guid: '12345678',
            srcVideo: 'video.mp4',
            workflowStatus: 'Complete',
            enableMediaPackage: true,
            mp4Outputs: ['mp4-output-1'],
            mp4Urls: ['mp4-url-1'],
            hlsPlaylist: 'hls-playlist',
            hlsUrl: 'hls-url',
            dashPlaylist: 'dash-playlist',
            dashUrl: 'dash-url',
            mssPlaylist: 'mss-playlist',
            mssUrl: 'mss-url',
            cmafDashPlaylist: 'cmaf-dash-playlist',
            cmafDashUrl: 'cmaf-dash-url',
            cmafHlsPlaylist: 'cmaf-hls-playlist',
            cmafHlsUrl: 'cmaf-hls-url'
        };

        const response = await lambda.handler(event);
        expect(response.mp4Outputs).to.be.undefined;
        expect(response.mp4Urls).to.be.undefined;
        expect(response.hlsPlaylist).to.be.undefined;
        expect(response.hlsUrl).to.be.undefined;
        expect(response.dashPlaylist).to.be.undefined;
        expect(response.dashUrl).to.be.undefined;
        expect(response.mssPlaylist).to.be.undefined;
        expect(response.mssUrl).to.be.undefined;
        expect(response.cmafDashPlaylist).to.be.undefined;
        expect(response.cmafDashUrl).to.be.undefined;
        expect(response.cmafHlsPlaylist).to.be.undefined;
        expect(response.cmafHlsUrl).to.be.undefined;
    });

    it('should return "ERROR" when workflowStatus is not defined', async () => {
        AWS.mock('SNS', 'publish', Promise.resolve());
        AWS.mock('Lambda', 'invoke', Promise.resolve());

        await lambda.handler(_error).catch(err => {
            expect(err.toString()).to.equal('Error: Workflow Status not defined.');
        });
    });

    it('should return "SNS ERROR" when send sns fails', async () => {
        AWS.mock('SNS', 'publish', Promise.reject('SNS ERROR'));
        AWS.mock('Lambda', 'invoke', Promise.resolve());

        await lambda.handler(_ingest).catch(err => {
            expect(err).to.equal('SNS ERROR');
        });
    });
});
