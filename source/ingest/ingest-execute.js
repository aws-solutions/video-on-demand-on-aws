/*********************************************************************************************************************
 *  Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance        *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://aws.amazon.com/asl/                                                                                    *
 *                                                                                                                    *
 *  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
/**
 * @author Solution Builders
 */
'use strict';
const AWS = require('aws-sdk');
const error = require('./lib/error.js');
const uuid = require('uuid');
const moment = require('moment');

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const stepfunctions = new AWS.StepFunctions({
    region: process.env.AWS_REGION
  });

  let key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  let guid = uuid.v4();
  let time = moment().utc().format('YYYY-MM-DD HH:mm.S');

  let input = {
    guid: guid,
    srcBucket: event.Records[0].s3.bucket.name,
    abrBucket: process.env.AbrDestination,
    mp4Bucket: process.env.Mp4Destination,
    workflowStatus: "ingest",
    startTime: time
  };

  // get file extension for the source file.
  let keyType = key.slice((key.lastIndexOf(".") - 1 >>> 0) + 2)

  if (keyType === 'json' || keyType === 'xml') {
    input.srcMetadataFile = key;
  } else {
    // video only workflow, encode options are set @ launch as cfn parameters.
    input.srcVideo = key;
    input.mp4 = JSON.parse("[" + process.env.Mp4 + "]");
    input.hls = JSON.parse("[" + process.env.Hls + "]");
    input.dash = JSON.parse("[" + process.env.Dash + "]");
    //convert env.FrameCapture from string to boolean
    if (process.env.FrameCapture === 'true') {
      input.frameCapture = true;
    } else {
      input.frameCapture = false;
    }
    input.imageOverlay = process.env.ImageOverlay;
  }

  let params = {
    stateMachineArn: process.env.IngestWorkflow,
    input: JSON.stringify(input),
    name: guid
  };

  console.log('workflow execute: ', JSON.stringify(input, null, 2));

  stepfunctions.startExecution(params).promise()
    .then(() => callback(null, 'success'))
    .catch(err => {
      error.handler(event, err);
      callback(err);
    });
};
