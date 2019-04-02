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

describe('#ENCODE::', () => {

  process.env.MediaConvertRole = 'Role';
  process.env.Workflow = 'vod';
  process.env.ErrorHandler = 'error_handler';

  let _event = {
    guid: "12345678",
    jobTemplate: "jobTemplate",
    srcVideo:"video.mp4",
    srcBucket:"src",
    destBucket:"dest"
  };

  let _withframe = {
    guid: "12345678",
    jobTemplate: "jobTemplate",
    srcVideo:"video.mp4",
    srcBucket:"src",
    destBucket:"dest",
    frameCapture:true
  };

  let data = {
    Job:{
      Id:'12345',
    }
  };

  let tmpl = {
    JobTemplate: {
      Settings:{
        OutputGroups: [
          {
            OutputGroupSettings:{
              Type:'HLS_GROUP_SETTINGS'
            }
          }
        ]
      }
    }
  }

  afterEach(() => {
    AWS.restore('MediaConvert');
  });

  it('should return "success" No FrameCapture Enode success', async () => {
    AWS.mock('MediaConvert', 'getJobTemplate', Promise.resolve(tmpl));
    AWS.mock('MediaConvert', 'createJob', Promise.resolve(data));

    let response = await lambda.handler(_event)
		expect(response.ecodeJobId).to.equal('12345');
    expect(response.encodingJob.Settings.OutputGroups[0].Name).to.equal('HLS Group');
  });

  it('should return "success" FrameCapture Enode success', async () => {
    AWS.mock('MediaConvert', 'getJobTemplate', Promise.resolve(tmpl));
    AWS.mock('MediaConvert', 'createJob', Promise.resolve(data));

    let response = await lambda.handler(_withframe)
		expect(response.ecodeJobId).to.equal('12345');
    expect(response.encodingJob.Settings.OutputGroups[1].CustomName).to.equal('Frame Capture');
  });

  it('should return "GET ERROR" when get template fails', async () => {
    AWS.mock('MediaConvert', 'getJobTemplate', Promise.reject('GET ERROR'));
    AWS.mock('Lambda','invoke', Promise.resolve());

    await lambda.handler(_event).catch(err => {
      expect(err).to.equal('GET ERROR');
    });
  });

  it('should return "JOB ERROR" when get template fails', async () => {
    AWS.mock('MediaConvert', 'getJobTemplate', Promise.resolve(tmpl));
    AWS.mock('MediaConvert', 'createJob', Promise.reject('JOB ERROR'));
    AWS.mock('Lambda','invoke', Promise.resolve());

    await lambda.handler(_event).catch(err => {
      expect(err).to.equal('JOB ERROR');
    });
  });

});
