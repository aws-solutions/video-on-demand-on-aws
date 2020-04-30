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

describe('#ERROR HANDLER::', () => {
    const _lambda = {
        guid: '1234',
        error: 'LAMBDA',
        function: 'workflow',
    };

    const _encode = {
        guid: '12345678',
        error: 'MEDIACONVERT',
        errorMessage: 'Encoding Error',
        detail: {
            jobId: '1111111',
            userMetadata: {
                guid: 'abcdefg'
            }
        }
    };

    afterEach(() => {
        AWS.restore('DynamoDB.DocumentClient');
        AWS.restore('SNS');
    });

    it('should return "FROM LAMBDA" processing a lambda error', async () => {
        AWS.mock('DynamoDB.DocumentClient', 'update', Promise.resolve());
        AWS.mock('SNS', 'publish', Promise.resolve());

        const response = await lambda.handler(_lambda);
        expect(response.error).to.equal('LAMBDA');
    });

    it('should return "FROM MEDIACONVERT" processing a mediaconvert error', async () => {
        AWS.mock('DynamoDB.DocumentClient', 'update', Promise.resolve());
        AWS.mock('SNS', 'publish', Promise.resolve());

        const response = await lambda.handler(_encode);
        expect(response.error).to.equal('MEDIACONVERT');
    });

    it('should return "DB_ERROR" processing a lambda error', async () => {
        AWS.mock('DynamoDB.DocumentClient', 'update', Promise.reject('DB_ERROR'));
        AWS.mock('SNS', 'publish', Promise.resolve());

        await lambda.handler(_lambda).catch(err => {
            expect(err).to.equal('DB_ERROR');
        });
    });

    it('should return "SNS_ERROR" processing a lambda error', async () => {
        AWS.mock('DynamoDB.DocumentClient', 'update', Promise.resolve());
        AWS.mock('SNS', 'publish', Promise.reject('SNS_ERROR'));

        await lambda.handler(_encode).catch(err => {
            expect(err).to.equal('SNS_ERROR');
        });
    });
});
