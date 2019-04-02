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
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('../index.js');

describe('#SNS ::', () => {

  let _ingest = {
    guid: "12345678",
    startTime: "now",
    srcVideo:'video.mp4',
    workflowStatus:'Ingest'
  };

  let _publish = {
    guid: "12345678",
    startTime: "now",
    srcVideo:'video.mp4',
    workflowStatus:'Complete',
    jobTemplate_2160p:'jobTemplate_720p',
    jobTemplate_1080p:'jobTemplate_1080p',
    jobTemplate_2160p:'jobTemplate_1080p'
  };

  let _error = {
    guid: "12345678",
    startTime: "now",
    srcVideo:'video.mp4',
  };
  process.env.ErrorHandler = 'error_handler'

  afterEach(() => {
    AWS.restore('SNS');
  });

  it('should return "Ingest" on sns ingest notification success', async () => {
		AWS.mock('SNS', 'publish', Promise.resolve());

		let response = await lambda.handler(_ingest)
		expect(response.workflowStatus).to.equal('Ingest');
	});

  it('should return "Complete" on sns Publish notification success', async () => {
    AWS.mock('SNS', 'publish', Promise.resolve());

    let response = await lambda.handler(_publish)
    expect(response.workflowStatus).to.equal('Complete');
  });

  it('should return "ERROR" when workflowStatus is not defined', async () => {
    AWS.mock('SNS', 'publish', Promise.resolve());
    AWS.mock('Lambda','invoke', Promise.resolve());

    await lambda.handler(_error).catch(err => {
			expect(err.toString()).to.equal('Error: Workflow Status not defined.');
		});
  });

  it('should return "SNS ERROR" when send sns fails', async () => {
    AWS.mock('SNS', 'publish', Promise.reject('SNS ERROR'));
    AWS.mock('Lambda','invoke', Promise.resolve());

    await lambda.handler(_ingest).catch(err => {
			expect(err).to.equal('SNS ERROR');
		});
  });

});
