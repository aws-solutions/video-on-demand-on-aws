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

const axios = require('axios');
const expect = require('chai').expect;
const MockAdapter = require('axios-mock-adapter');

const lambda = require('./index.js');
const _event = {
    RequestType: 'Create',
    ServiceToken: 'arn:aws:lambda',
    ResponseURL: 'https://cloudformation',
    StackId: 'arn:aws:cloudformation',
    RequestId: '63e8ffa2-3059-4607-a450-119d473c73bc',
    LogicalResourceId: 'Uuid',
    ResourceType: 'Custom::UUID',
    ResourceProperties: {
        ServiceToken: 'arn:aws:lambda',
        Resource: 'abc'
    }
};

const _context = {
    logStreamName: 'cloudwatch'
};

const _responseStatus = 'ok';
const _responseData = {
    test: 'testing'
};

describe('#CFN RESPONSE::', () => {
    it('should return "200" on a send cfn response sucess', async () => {
        const mock = new MockAdapter(axios);
        mock.onPut().reply(200, {});

        lambda.send(_event, _context, _responseStatus, _responseData, (err, res) => {
            expect(res.status).to.equal(200);
        });
    });

    it('should return "Network Error" on connection timedout', async () => {
        const mock = new MockAdapter(axios);
        mock.onPut().networkError();

        await lambda.send(_event, _context, _responseStatus, _responseData).catch(err => {
            expect(err.toString()).to.equal('Error: Network Error');
        });
    });
});
