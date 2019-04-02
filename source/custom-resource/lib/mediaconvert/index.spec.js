/*******************************************************************************
* Copyright 2019 Amazon.com, Inc. and its affiliates. All Rights Reserved.
*
* Licensed under the Amazon Software License (the "License").
* You may not use this file except in compliance with the License.
* A copy of the License is located at
*
*   http://aws.amazon.com/asl/
*
* or in the "license" file accompanying this file. This file is distributed
* on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
* express or implied. See the License for the specific language governing
* permissions and limitations under the License.
*
********************************************************************************/
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./index.js');

let data = {
    JobTemplate: {
        Name: 'name'
    },
    Endpoints: [{
        Url: 'https://test.com'
    }]
};

let _config = {
    StackName: 'test',
    EndPoint: 'https://test.com',
    Qvbr: 'true'
}

let update_data = {
  JobTemplates:[
    {
      Name:'test_Ott_720p_Avc_Aac_16x9_qvbr'
    }
  ]
}

describe('#MEDIACONVERT::', () => {

    afterEach(() => {
        AWS.restore('MediaConvert');
    });

    it('should return "SUCCESS" on mediaconvert describeEndpoints', async () => {

        AWS.mock('MediaConvert', 'describeEndpoints', Promise.resolve(data));

        let response = await lambda.getEndpoint(_config)
        expect(response.EndpointUrl).to.equal('https://test.com');
    });

    it('should return "SUCCESS" on mediaconvert create templates', async () => {

        AWS.mock('MediaConvert', 'createPreset', Promise.resolve());
        AWS.mock('MediaConvert', 'createJobTemplate', Promise.resolve(data));

        let response = await lambda.createTemplates(_config)
        expect(response).to.equal('success');
    });

    it('should return "SUCCESS" on mediaconvert delete templates', async () => {

        AWS.mock('MediaConvert', 'deletePreset', Promise.resolve());
        AWS.mock('MediaConvert', 'deleteJobTemplate', Promise.resolve());

        let response = await lambda.deleteTemplates(_config)
        expect(response).to.equal('success');
    });

    it('should return "SUCCESS" on mediaconvert update templates', async () => {

        AWS.mock('MediaConvert', 'listJobTemplates', Promise.resolve(update_data));

        let response = await lambda.updateTemplates(_config)
        expect(response).to.equal('success');
    });

    it('should return "ERROR" on mediaconvert describeEndpoints', async () => {
        AWS.mock('MediaConvert', 'listJobTemplates', Promise.reject('ERROR'));

        await lambda.updateTemplates(_config).catch(err => {
            expect(err).to.equal('ERROR');
        });
    });

    it('should return "ERROR" on mediaconvert describeEndpoints', async () => {
        AWS.mock('MediaConvert', 'describeEndpoints', Promise.reject('ERROR'));

        await lambda.getEndpoint(_config).catch(err => {
            expect(err).to.equal('ERROR');
        });
    });

    it('should return "ERROR" on mediaconvert create templates', async () => {
        AWS.mock('MediaConvert', 'createPreset', Promise.resolve());
        AWS.mock('MediaConvert', 'createJobTemplate', Promise.reject('ERROR'));

        await lambda.createTemplates(_config).catch(err => {
            expect(err).to.equal('ERROR');
        });
    });

});
