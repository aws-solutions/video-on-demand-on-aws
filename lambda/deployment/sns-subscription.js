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
/*
Cloudformation custom resource to create S3 Notification & SNS subscription for
the 2 lambda functions that trigger Step Functions.
Required due to circular dependencies in the cfn template.
*/
'use strict';
const response = require('cfn-response');
const AWS = require('aws-sdk');
const sns = new AWS.SNS({
    region: process.env.AWS_REGION
});

exports.handler = function(event, context) {
    var responseData;

    if (event.RequestType == "Delete") {
        response.send(event, context, response.SUCCESS);
        return;
    }

    var comp_params = {
        Protocol: 'lambda',
        TopicArn: event.ResourceProperties.EtsComplete,
        Endpoint: event.ResourceProperties.PublishArn
    };

    sns.subscribe(comp_params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            responseData = err;
            response.send(event, context, response.FAILED, responseData);
        } else {
            console.log("Lambda subscription to ets complete SNS successful" );
            responseData = {
                S3event: "Success"
            };
            response.send(event, context, response.SUCCESS, responseData);
        }
    });
};
