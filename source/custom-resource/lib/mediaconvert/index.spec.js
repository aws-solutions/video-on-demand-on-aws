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
const { 
    MediaConvertClient, 
    CreateJobTemplateCommand, 
    DescribeEndpointsCommand, 
    DeletePresetCommand, 
    DeleteJobTemplateCommand,
    ListJobTemplatesCommand
} = require('@aws-sdk/client-mediaconvert');

const lambda = require('./index.js');

const data = {
    JobTemplate: {
        Name: 'name'
    },
    Endpoints: [{
        Url: 'https://test.com'
    }]
};

const _config = {
    StackName: 'test',
    EndPoint: 'https://test.com',
    EnableMediaPackage: 'false'
};

const update_data = {
    JobTemplates: [{ Name: 'test_Ott_720p_Avc_Aac_16x9_qvbr' }]
};

const update_data_no_preset = {
    JobTemplates: [{ Name: 'test_Ott_720p_Avc_Aac_16x9_qvbr_no_preset' }]
}

describe('#MEDIACONVERT::', () => {
    const mediaConvertClientMock = mockClient(MediaConvertClient);
    afterEach(() => mediaConvertClientMock.reset());

    describe('Create', () => {
        it('should return "SUCCESS" on create templates', async () => {
            mediaConvertClientMock.on(CreateJobTemplateCommand).resolves(data);

            const response = await lambda.createTemplates(_config);
            expect(response).to.equal('success');
        });

        it('should fail when createJobTemplate throws an exception', async () => {
            mediaConvertClientMock.on(CreateJobTemplateCommand).rejects('[Error: ERROR]');

            await lambda.createTemplates(_config).catch(err => {
                expect(err.toString()).to.equal('Error: [Error: ERROR]');
            });
        });
    });

    describe('Describe', () => {
        it('should return "SUCCESS" on describeEndpoints', async () => {
            mediaConvertClientMock.on(DescribeEndpointsCommand).resolves(data);

            const response = await lambda.getEndpoint(_config);
            expect(response.EndpointUrl).to.equal('https://test.com');
        });

        it('should fail when describeEndpoints throws an exception', async () => {
            mediaConvertClientMock.on(DescribeEndpointsCommand).rejects('[Error: ERROR]');

            await lambda.getEndpoint(_config).catch(err => {
                expect(err.toString()).to.equal('Error: [Error: ERROR]');
            });
        });
    });

    describe('Update', () => {
        it('should return "SUCCESS" on update templates', async () => {
            mediaConvertClientMock.on(ListJobTemplatesCommand).resolves(update_data);
            mediaConvertClientMock.on(CreateJobTemplateCommand).resolves(update_data);

            const response = await lambda.updateTemplates(_config);
            expect(response).to.equal('success');
        });

        it('should correctly handle updates when new templates do not exist', async () => {

            let wasCreateTemplateInvoked = false;
            let toBeCreated = [];

            mediaConvertClientMock.on(ListJobTemplatesCommand).resolves(update_data);
            mediaConvertClientMock.on(CreateJobTemplateCommand, (params) => {
                wasCreateTemplateInvoked = true;
                toBeCreated.push(params.Name);

                return Promise.resolve(data);
            });

            await lambda.updateTemplates(_config);
            expect(wasCreateTemplateInvoked).to.be.true;

            toBeCreated.forEach(item => expect(item.endsWith('_no_preset')).to.be.true);
        });

        it('should correctly handle update when new templates exist', async () => {
            let wasCreateTemplateInvoked = false;
            let toBeCreated = [];

            mediaConvertClientMock.on(ListJobTemplatesCommand).resolves(update_data_no_preset);
            mediaConvertClientMock.on(CreateJobTemplateCommand, (params) => {
                wasCreateTemplateInvoked = false;
                toBeCreated.push(params.Name);

                return Promise.resolve(data);
            });

            await lambda.updateTemplates(_config);
            expect(wasCreateTemplateInvoked).to.be.false;
            toBeCreated.forEach(item => expect(item.endsWith('_no_preset')).to.be.false);
        });

        it('should fail when listJobTemplates throws an exception', async () => {
            mediaConvertClientMock.on(ListJobTemplatesCommand).rejects('[Error: ERROR]');

            await lambda.updateTemplates(_config).catch(err => {
                expect(err.toString()).to.equal('Error: [Error: ERROR]');
            });
        });
    });

    describe('Delete', () => {
        it('should return "SUCCESS" on delete templates', async () => {
            mediaConvertClientMock.on(DeletePresetCommand).resolves();
            mediaConvertClientMock.on(DeleteJobTemplateCommand).resolves();

            const response = await lambda.deleteTemplates(_config);
            expect(response).to.equal('success');
        });
    });
});
