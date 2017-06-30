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
const child_process = require('child_process');
const fs = require('fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    if (event.RequestType == "Delete") {
        response.send(event, context, response.SUCCESS);
        return;
    }

    let params = {
        Bucket: event.ResourceProperties.Source,
        NotificationConfiguration: {
          LambdaFunctionConfigurations: [
        {
            Events: ['s3:ObjectCreated:*'],
            LambdaFunctionArn: event.ResourceProperties.IngestArn,
            Filter: {  Key: {FilterRules: [{Name: 'suffix',Value: '.mpg'}]}},
            Id: 'execute-vod-steps mpg'
        },
        {
          Events: ['s3:ObjectCreated:*'],
          LambdaFunctionArn: event.ResourceProperties.IngestArn,
          Filter: {  Key: {FilterRules: [{Name: 'suffix',Value: '.mp4'}]}},
          Id: 'execute-vod-steps mp4'
        },
        {
          Events: ['s3:ObjectCreated:*'],
          LambdaFunctionArn: event.ResourceProperties.IngestArn,
          Filter: {  Key: {FilterRules: [{Name: 'suffix',Value: '.mv4'}]}},
          Id: 'execute-vod-steps mv4'
        },
        {
          Events: ['s3:ObjectCreated:*'],
          LambdaFunctionArn: event.ResourceProperties.IngestArn,
          Filter: {  Key: {FilterRules: [{Name: 'suffix',Value: '.mov'}]}},
          Id: 'execute-vod-steps mov'
        }
      ]
     }
    };

    s3.putBucketNotificationConfiguration(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            response.send(event, context, response.FAILED);
        } else {
            if (event.ResourceProperties.Watermark === 'Yes') {
                // upload logo for encoding watermark
                let s3_put = {
                    Bucket: event.ResourceProperties.Source,
                    Key: 'watermarks/aws-logo.png',
                    Body: fs.createReadStream('./aws-logo.png'),
                };
                s3.putObject(s3_put, function(err, data) {
                    if (err) {
                        console.log(err, err.stack);
                    } else {
                        console.log('AWS logo uploaded to source bucket');
                    }
                });
            }
            console.log("Bucket NotificationConfiguration Success");
            response.send(event, context, response.SUCCESS);
        }
    });
};
