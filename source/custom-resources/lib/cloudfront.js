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
 **/
'use strict';
const fs = require('fs');
const AWS = require('aws-sdk');

let response;

let createPromise = function() {
  response = new Promise((res, reject) => {

    const cloudfront = new AWS.CloudFront();

    let params = {
      CloudFrontOriginAccessIdentityConfig: {
        CallerReference: Math.random().toString(),
        Comment: 'VOD on AWS'
      }
    };

    cloudfront.createCloudFrontOriginAccessIdentity(params, function(err, data) {
      if (err) reject(err);
      else {
        let responseData = {
          'Identity': data.Id,
          'S3CanonicalUserId': data.CloudFrontOriginAccessIdentity.S3CanonicalUserId
        };
        res(responseData);
      }
    });
  });
  return response;
};

module.exports = {
  createIdentity: createPromise
};
