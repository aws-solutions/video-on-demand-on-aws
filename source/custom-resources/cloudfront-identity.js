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
const response = require('cfn-response');
const AWS = require('aws-sdk');
const cloudfront = new AWS.CloudFront();
const s3 = new AWS.S3();

exports.handler = function(event, context) {

    if (event.RequestType == "Delete") {
        response.send(event, context, response.SUCCESS);
        return;
    }

    var params = {
        CloudFrontOriginAccessIdentityConfig: {
            CallerReference: Math.random().toString(),
            Comment: 'AccessIdentity for VOD HLS streaming'
        }
    };

    var responseData;

    cloudfront.createCloudFrontOriginAccessIdentity(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            responseData = err;
            response.send(event, context, response.FAILED, responseData);
        } else {
            var identity = data.Id;
            console.log('CF Identity Id = ' + identity + 'Updating HLS Bucket policy ');
            var json = JSON.stringify({
                "Version": "2012-10-17",
                "Id": "PolicyForCloudFrontHLSContent",
                "Statement": [{
                    "Sid": " Grant a CloudFront Origin Identity access HLS Content",
                    "Effect": "Allow",
                    "Principal": {
                        "CanonicalUser": data.CloudFrontOriginAccessIdentity.S3CanonicalUserId
                    },
                    "Action": "s3:GetObject",
                    "Resource": "arn:aws:s3:::" + event.ResourceProperties.Bucket + "/*"
                }]
            });
            console.log(json);

            var params = {
                Bucket: event.ResourceProperties.Bucket,
                Policy: json
            };
            console.log(params);
            s3.putBucketPolicy(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    responseData = err;
                    response.send(event, context, response.FAILED, responseData);
                } else {
                    responseData = {
                        Identity: identity
                    };
                    console.log(data);
                    response.send(event, context, response.SUCCESS, responseData, identity);
                }
            });
        }
    });
};
