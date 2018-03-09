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

let errPromise = function(event, _err) {
  console.log('Running Error Handler');

  const lambda = new AWS.Lambda({
    region: process.env.AWS_REGION
  });

  let params;

  let payload = {
    "guid": event.guid,
    "event": event,
    "function": process.env.AWS_LAMBDA_FUNCTION_NAME,
    "error": _err.toString()
  };

  params = {
    FunctionName: process.env.ErrorHandler,
    Payload: JSON.stringify(payload, null, 2)
  };
  lambda.invoke(params).promise()
    .catch(err => console.log(err));
};
module.exports = {
  handler: errPromise
};
