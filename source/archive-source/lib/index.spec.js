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

const expect = require('chai').expect;
const path = require('path');
const { mockClient } = require("aws-sdk-client-mock");
const { S3Client, PutObjectTaggingCommand} = require("@aws-sdk/client-s3");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const lambda = require('../index.js');

describe('#SOURCE ARCHIVE::', () => {
    const _event = {
        guid: '1234',
        srcVideo: 'example.mpg',
        srcBucket: 'bucket',
        archiveSource: 'GLACIER'

    };

    process.env.ErrorHandler = 'error_handler';
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'Lambda';

    const s3ClientMock = mockClient(S3Client);
    const lambdaClientMock = mockClient(LambdaClient);

    it('should return "SUCCESS" when s3 tag object returns success', async () => {
        s3ClientMock.on(PutObjectTaggingCommand).resolves();

        const response = await lambda.handler(_event);
        expect(response.guid).to.equal('1234');
    });

    it('should return "TAG ERROR" when s3 tag object fails', async () => {
        s3ClientMock.on(PutObjectTaggingCommand).rejects('TAG ERROR');
        lambdaClientMock.on(InvokeCommand).resolves();

        await lambda.handler(_event).catch(err => {
            expect(err).to.equal('TAG ERROR');
        });
    });
});
