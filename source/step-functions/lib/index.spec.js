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

describe('#STEP FUNCTIONS::', () => {

  process.env.IngestWorkflow = 'INGEST';
  process.env.ProcessWorkflow = 'PROCESS';
  process.env.PublishWorkflow = 'PUBLISH';
  process.env.ErrorHandler = 'error_handler';

	let _ingest = {
		Records: [
      {
        s3:{
          object: {
            key: "big_bunny.mp4",
          }
        }
		}]
	};

  let _process = {
    guid:'1234'
  }

  let _publish = {
    detail:{
      userMetadata:{
        guid:'1234'
      }
    }
  }

   let _error = {};

	let data = {
		executionArn: "arn"
	}

	afterEach(() => {
		AWS.restore('StepFunctions');
	});

	it('should return "success" on Ingest Execute success', async () => {
		AWS.mock('StepFunctions', 'startExecution', Promise.resolve(data));

    let response = await lambda.handler(_ingest)
		expect(data.executionArn).to.equal('arn');
	});

  it('should return "success" on process Execute success', async () => {
    AWS.mock('StepFunctions', 'startExecution', Promise.resolve(data));

    let response = await lambda.handler(_process)
    expect(data.executionArn).to.equal('arn');
  });

  it('should return "success" on publish Execute success', async () => {
    AWS.mock('StepFunctions', 'startExecution', Promise.resolve(data));

    let response = await lambda.handler(_publish)
    expect(data.executionArn).to.equal('arn');
  });

  it('should return "ERROR" with an invalid event object', async () => {
    AWS.mock('StepFunctions', 'startExecution', Promise.resolve('data'));
    AWS.mock('Lambda','invoke', Promise.resolve());

    await lambda.handler(_error).catch(err => {
			expect(err.toString()).to.equal('Error: invalid event object');
    });
  });

  it('should return "STEP ERROR" when step execution fails', async () => {
    AWS.mock('StepFunctions', 'startExecution', Promise.reject('STEP ERROR'));
    AWS.mock('Lambda','invoke', Promise.resolve());

    await lambda.handler(_ingest).catch(err => {
      expect(err).to.equal('STEP ERROR');
    });
  });

});
