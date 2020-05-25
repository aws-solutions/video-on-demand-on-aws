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

describe('#PROFILER::', () => {
    process.env.ErrorHandler = 'error_handler';

    const _event = {
        guid: '12345678'
    };

    const _tmpl_event = {
        guid: '12345678',
        jobTemplate: 'customTemplate'
    };

    const data = {
        Item: {
            guid: '12345678',
            srcMediainfo: '{ "video": [{ "height": 720, "width": 1280 }] }',
            jobTemplate_2160p: 'tmpl1',
            jobTemplate_1080p: 'tmpl2',
            jobTemplate_720p: 'tmpl3',
            frameCapture: true
        }
    };

    afterEach(() => AWS.restore('DynamoDB.DocumentClient'));

    it('should return "SUCCESS" on profile set', async () => {
        AWS.mock('DynamoDB.DocumentClient', 'get', Promise.resolve(data));

        const response = await lambda.handler(_event);
        expect(response.jobTemplate).to.equal('tmpl3');
        expect(response.frameCaptureHeight).to.equal(720);
        expect(response.frameCaptureWidth).to.equal(1280);
        expect(response.isCustomTemplate).to.be.false;
    });

    it('should return "SUCCESS" using a custom template', async () => {
        AWS.mock('DynamoDB.DocumentClient', 'get', Promise.resolve(data));

        const response = await lambda.handler(_tmpl_event);
        expect(response.jobTemplate).to.equal('customTemplate');
        expect(response.frameCaptureHeight).to.equal(720);
        expect(response.frameCaptureWidth).to.equal(1280);
        expect(response.isCustomTemplate).to.be.true;
    });

    it('should return "DB ERROR" when db get fails', async () => {
        AWS.mock('DynamoDB.DocumentClient', 'get', Promise.reject('DB ERROR'));
        AWS.mock('Lambda', 'invoke', Promise.resolve());

        await lambda.handler(_event).catch(err => {
            expect(err).to.equal('DB ERROR');
        });
    });
});
