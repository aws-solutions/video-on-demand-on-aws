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

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const s3 = new AWS.S3();

  function validate(key) {
    let response = new Promise((res, reject) => {
      let params = {
        Bucket: event.srcBucket,
        Key: key
      };
      s3.headObject(params, function(err, data) {
        if (err) reject('error: ',key,' not found');
        else {
          res(data);
        }
      });
    });
    return response;
  }

  let promises = [];

  promises.push(validate(event.srcVideo));

  if (event.ImageOverlay) {
    promises.push(validate('image-overlay/' + event.ImageOverlay));
  }

  Promise.all(promises)
    .then(() => callback(null, event))
    .catch(err => {
      error.handler(event, err);
      callback(err);
    });
};
