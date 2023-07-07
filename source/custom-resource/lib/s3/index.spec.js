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
const { S3Client, PutBucketNotificationConfigurationCommand} = require("@aws-sdk/client-s3");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const lambda = require('./index.js');

const _video = {
    WorkflowTrigger: 'VideoFile',
    IngestArn: 'arn',
    Source: 'srcBucket'
};

const _metadata = {
    WorkflowTrigger: 'MetadataFile',
    IngestArn: 'arn',
    Source: 'srcBucket'
};

describe('#S3 PUT NOTIFICATION::', () => {
    const s3ClientMock = mockClient(S3Client);
    const lambdaClientMock = mockClient(LambdaClient);

    it('should succeed on VideoFile trigger', async () => {
        s3ClientMock.on(PutBucketNotificationConfigurationCommand).resolves();

        const response = await lambda.putNotification(_video);
        expect(response).to.equal('success');
    });

    it('should succeed on MetadataFile trigger', async () => {
        s3ClientMock.on(PutBucketNotificationConfigurationCommand).resolves();

        const response = await lambda.putNotification(_metadata);
        expect(response).to.equal('success');
    });

    it('should throw an exception when putBucketNotificationConfiguration fails', async () => {
        s3ClientMock.on(PutBucketNotificationConfigurationCommand).rejects('[Error: ERROR]');

        await lambda.putNotification(_video).catch(err => {
            expect(err.toString()).to.equal('Error: [Error: ERROR]');
        });
    });

    it('should throw an exception when trigger is unknown', async () => {
        s3ClientMock.on(PutBucketNotificationConfigurationCommand).resolves();
        const invalid = { WorkflowTrigger: 'bogus' };

        await lambda.putNotification(invalid).catch(err => {
            expect(err.message).to.equal('Unknown WorkflowTrigger: bogus');
        });
    });
});
