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

/*
Custom resource to create ets presets
*/
'use strict';
const response = require('cfn-response');
const uuid = require('uuid');
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: process.env.AWS_REGION});

exports.handler = function(event, context) {

    if (event.RequestType == "Delete") {
        response.send(event, context, response.SUCCESS);
        return;
    }

    let params = {
     FunctionName: event.ResourceProperties.Publish,
     Environment: {
        Variables: {
          uuid: uuid.v4(),
          Dynamo: event.ResourceProperties.Dynamo,
          StepsPublish: event.ResourceProperties.StepsPublish
        }
      }
    };

    lambda.updateFunctionConfiguration(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        response.send(event, context, response.FAILED);
      }
      else {
        console.log('Updated publish function with metrics UUID');
        response.send(event, context, response.SUCCESS);
      }
    });

};
