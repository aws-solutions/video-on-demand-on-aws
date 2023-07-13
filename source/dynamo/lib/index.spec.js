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
const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = require('../index.js');

describe('#DYNAMODB UPDATE::', () => {
    const _event = {
        guid: 'SUCCESS',
        hello: 'from AWS mock'
    };

    process.env.ErrorHandler = 'error_handler';

    const dynamoDBDocumentClientMock = mockClient(DynamoDBDocumentClient);
    const lambdaClientMock = mockClient(LambdaClient);
    afterEach(() => {
        dynamoDBDocumentClientMock.reset();
    });

    it('should return "SUCCESS" when db put returns success', async () => {
        dynamoDBDocumentClientMock.on(UpdateCommand).resolves();

        const response = await lambda.handler(_event);
        expect(response.guid).to.equal('SUCCESS');
    });

    it('should return "DB ERROR" when db put fails', async () => {
        dynamoDBDocumentClientMock.on(UpdateCommand).rejects('DB ERROR');
        lambdaClientMock.on(InvokeCommand).resolves();

        await lambda.handler(_event).catch(err => {
            expect(err.toString()).to.equal('Error: DB ERROR');
        });
    });
});
