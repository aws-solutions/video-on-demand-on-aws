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
    afterEach(() => AWS.restore('S3'));

    it('should succeed on VideoFile trigger', async () => {
        AWS.mock('S3', 'putBucketNotificationConfiguration', Promise.resolve());

        const response = await lambda.putNotification(_video);
        expect(response).to.equal('success');
    });

    it('should succeed on MetadataFile trigger', async () => {
        AWS.mock('S3', 'putBucketNotificationConfiguration', Promise.resolve());

        const response = await lambda.putNotification(_metadata);
        expect(response).to.equal('success');
    });

    it('should throw an exception when putBucketNotificationConfiguration fails', async () => {
        AWS.mock('S3', 'putBucketNotificationConfiguration', Promise.reject('ERROR'));

        await lambda.putNotification(_video).catch(err => {
            expect(err).to.equal('ERROR');
        });
    });

    it('should throw an exception when trigger is unknown', async () => {
        AWS.mock('S3', 'putBucketNotificationConfiguration', Promise.resolve());
        const invalid = { WorkflowTrigger: 'bogus' };

        await lambda.putNotification(invalid).catch(err => {
            expect(err.message).to.equal('Unknown WorkflowTrigger: bogus');
        });
    });
});
