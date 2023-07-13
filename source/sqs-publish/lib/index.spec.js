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

const expect = require('chai').expect;
const path = require('path');
const { mockClient } = require('aws-sdk-client-mock');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = require('../index.js');

describe('#SNS::', () => {
    const _event = {
        guid: '12345678',
        startTime: 'now',
        srcVideo: 'video.mp4',
    };

    process.env.ErrorHandler = 'error_handler';
    process.env.SqsQueue = 'https://sqs.amazonaws.com/1234'

    const lambdaClientMock = mockClient(LambdaClient);
    const sQSClientMock = mockClient(SQSClient);

    afterEach(() => sQSClientMock.reset());

    it('should return "success" on send SQS message', async () => {
        sQSClientMock.on(SendMessageCommand).resolves();

        const response = await lambda.handler(_event);
        expect(response.srcVideo).to.equal('video.mp4');
    });

    it('should return "SQS ERROR" when send SQS message fails', async () => {
        sQSClientMock.on(SendMessageCommand).rejects('SQS ERROR');
        lambdaClientMock.on(InvokeCommand).resolves();

        await lambda.handler(_event).catch(err => {
            expect(err.toString()).to.equal('Error: SQS ERROR');
        });
    });
});
