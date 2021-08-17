/*********************************************************************************************************************
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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

describe('#SNS::', () => {
    const _mediaConvertEvent = {
        "detail-type": "MediaConvert Job State Change",
        "source": "aws.mediaconvert",
        "detail": {
            "timestamp": 1629203099186,
            "jobId": "1629203005873-2s2878",
            "status": "INPUT_INFORMATION",
            "userMetadata": {
                "guid": "fcc655dc-6a06-47a2-8bed-ae9b767d0845",
                "cmsId": "foo",
                "workflow": "buzzhub"
            }
        }
    };

    const _jobEvent = {
        "encodeJobId": "1629203005873-2s2878",
        "srcVideo": "foo.mp4",
        "cmsId": "bar",
    };

    process.env.ErrorHandler = 'error_handler';
    process.env.SqsQueue = 'https://sqs.amazonaws.com/1234'

    afterEach(() => AWS.restore('SQS'));

    it('should return "success" on send SQS message for MediaConvert event', async () => {
        AWS.mock('SQS', 'sendMessage', Promise.resolve());

        const response = await lambda.handler(_mediaConvertEvent);
        expect(response.detail.userMetadata.cmsId).to.equal('foo');
    });

    it('should return "success" on send SQS message for transcoding job event', async () => {
        AWS.mock('SQS', 'sendMessage', Promise.resolve());

        const response = await lambda.handler(_jobEvent);
        expect(response.cmsId).to.equal('bar');
    });

    it('should return "SQS ERROR" when send SQS message fails', async () => {
        AWS.mock('SQS', 'sendMessage', Promise.reject('SQS ERROR'));
        AWS.mock('Lambda', 'invoke', Promise.resolve());

        await lambda.handler(_mediaConvertEvent).catch(err => {
            expect(err).to.equal('SQS ERROR');
        });
    });
});
