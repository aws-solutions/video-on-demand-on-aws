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

const _config = {
    SolutionId: 'SO0021',
    UUID: '999-999',
    ServiceToken: 'lambda-arn',
    Resource: 'AnonymousMetric'
};

describe('#SEND METRICS', () => {
    it('should return "200" on a send metrics sucess', async () => {
        const mock = new MockAdapter(axios);
        mock.onPost().reply(200, {});

        lambda.send(_config, (_err, res) => {
            expect(res).to.equal(200);
        });
    });

    it('should return "Network Error" on connection timedout', async () => {
        const mock = new MockAdapter(axios);
        mock.onPut().networkError();

        await lambda.send(_config).catch(err => {
            expect(err.toString()).to.equal('Error: Request failed with status code 404');
        });
    });

    it('should remove ServiceToken and Resource from metrics data', () => {
        const sanitizedData = lambda.sanitizeData(_config);
        expect(sanitizedData.ServiceToken).to.be.undefined;
        expect(sanitizedData.Resource).to.be.undefined;
    });
});
