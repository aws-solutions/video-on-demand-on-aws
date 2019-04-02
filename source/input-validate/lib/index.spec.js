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

describe('#INPUT VALIDATE::', () => {

  process.env.ErrorHandler = 'error_handler';
  process.env.FrameCapture = 'true';
  process.env.ArchiveSource = 'true';
  process.env.Source = 'source_bucket';

  let _video = {
    workflowTrigger:'Video',
    guid:'1234-1223232-212121',
    Records:[
      {
        s3:{
          object:{
            key:'video.mp4'
          }
        }
      }
    ]
  };

  let _error = {
    workflowTrigger:'',
    guid:'1234-1223232-212121'
  }

  let _json = {
    workflowTrigger:'Metadata',
    guid:'1234-1223232-212121',
    Records:[
      {
        s3:{
          object:{
            key:'metadata.json'
          }
        }
      }
    ]
  };

  let _metadata = {
	   "Body": "{\"srcVideo\": \"video_from_json.mp4\"}"
  }

  afterEach(() => {
    AWS.restore('S3');
  });

  it('should return "SUCCESS" when validating souce video', async () => {

		let response = await lambda.handler(_video)
		expect(response.srcVideo).to.equal('video.mp4');
	});

  it('should return "SUCCESS" when validating metadata', async () => {
    AWS.mock('S3', 'getObject', Promise.resolve(_metadata));
    AWS.mock('S3', 'headObject', Promise.resolve());

    let response = await lambda.handler(_json)
    expect(response.srcVideo).to.equal('video_from_json.mp4');
  });

  it('should return "S3 GET  ERROR" when validating metadata', async () => {
    AWS.mock('S3', 'getObject', Promise.reject('S3 GET ERROR'));
    AWS.mock('S3', 'headObject', Promise.resolve());
    AWS.mock('Lambda','invoke', Promise.resolve());

    await lambda.handler(_json).catch(err => {
      expect(err).to.equal('S3 GET ERROR');
    });
  });

});
