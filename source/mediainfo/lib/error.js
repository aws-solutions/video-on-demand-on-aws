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
const sns = new AWS.SNS({region: process.env.AWS_REGION});

let errHandler = function(guid, error) {

  console.log('RUNNING ERROR HANDLER');

  let msg = {
    "guid": guid,
    "function":process.env.AWS_LAMBDA_FUNCTION_NAME,
    "error": error.toString()
  };

  let params = {
        Subject: 'Workflow error: ' + guid,
        Message: JSON.stringify(msg, null, 2),
        TargetArn: process.env.ErrorsSns
    };

    sns.publish(params, function(err, data) {
        if (err) throw (err);
        else {
            console.log(error);
            console.log('Error message sent to ErrorSns');
            return;
        }
    });
};

module.exports = {
    error: errHandler
};
