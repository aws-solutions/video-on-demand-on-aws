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
let params;

let noticePromise = function(event) {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01'
  });
  response = new Promise((res, reject) => {

    if (event.ResourceProperties.WorkflowTrigger === 'SourceMetadata') {
      params = {
        Bucket: event.ResourceProperties.Source,
        NotificationConfiguration: {
          LambdaFunctionConfigurations: [{
              Events: ['s3:ObjectCreated:*'],
              LambdaFunctionArn: event.ResourceProperties.IngestArn,
              Filter: {
                Key: {
                  FilterRules: [{
                    Name: 'suffix',
                    Value: 'json'
                  }]
                }
              }
            },
            {
              Events: ['s3:ObjectCreated:*'],
              LambdaFunctionArn: event.ResourceProperties.IngestArn,
              Filter: {
                Key: {
                  FilterRules: [{
                    Name: 'suffix',
                    Value: 'xml'
                  }]
                }
              }
            }
          ]
        }
      };
    } else {
      params = {
        Bucket: event.ResourceProperties.Source,
        NotificationConfiguration: {
          LambdaFunctionConfigurations: [{
              Events: ['s3:ObjectCreated:*'],
              LambdaFunctionArn: event.ResourceProperties.IngestArn,
              Filter: {
                Key: {
                  FilterRules: [{
                    Name: 'suffix',
                    Value: '.mpg'
                  }]
                }
              }
            },
            {
              Events: ['s3:ObjectCreated:*'],
              LambdaFunctionArn: event.ResourceProperties.IngestArn,
              Filter: {
                Key: {
                  FilterRules: [{
                    Name: 'suffix',
                    Value: '.mp4'
                  }]
                }
              }
            },
            {
              Events: ['s3:ObjectCreated:*'],
              LambdaFunctionArn: event.ResourceProperties.IngestArn,
              Filter: {
                Key: {
                  FilterRules: [{
                    Name: 'suffix',
                    Value: '.mv4'
                  }]
                }
              }
            },
            {
              Events: ['s3:ObjectCreated:*'],
              LambdaFunctionArn: event.ResourceProperties.IngestArn,
              Filter: {
                Key: {
                  FilterRules: [{
                    Name: 'suffix',
                    Value: '.mov'
                  }]
                }
              }
            }
          ]
        }
      };
    }
    s3.putBucketNotificationConfiguration(params, function(err, data) {
      if (err) reject(err);
      else {
        res('sucess');
      }
    });
  });
  return response;
};

let putPromise = function(event) {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01'
  });

  params = {
    Bucket: event.ResourceProperties.Source,
    Key: 'image-overlay/aws-logo.png',
    Body: fs.createReadStream('./assets/aws-logo.png')
  };

  response = new Promise((res, reject) => {

    s3.putObject(params, function(err, data) {
      if (err) reject(err);
      else {
        res('sucess');
      }
    });
  });
  return response;
};

module.exports = {
  s3Notification: noticePromise,
  putObject: putPromise
};
