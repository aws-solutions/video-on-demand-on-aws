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

describe('#DYNAMODB UPDATE::', () => {
    const _event = {
        guid: 'SUCCESS',
        hello: 'from AWS mock'
    };

    process.env.ErrorHandler = 'error_handler';

    afterEach(() => {
        AWS.restore('DynamoDB.DocumentClient');
    });

    it('should return "SUCCESS" when db put returns success', async () => {
        AWS.mock('DynamoDB.DocumentClient', 'update', Promise.resolve());

        const response = await lambda.handler(_event);
        expect(response.guid).to.equal('SUCCESS');
    });

    it('should return "DB ERROR" when db put fails', async () => {
        AWS.mock('DynamoDB.DocumentClient', 'update', Promise.reject('DB ERROR'));
        AWS.mock('Lambda', 'invoke', Promise.resolve());

        await lambda.handler(_event).catch(err => {
            expect(err).to.equal('DB ERROR');
        });
    });
});
