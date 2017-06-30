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
const stepfunctions = new AWS.StepFunctions({
    region: process.env.AWS_REGION
});

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  let params = {
      stateMachineArn: process.env.ProcessWorkflow,
      input: JSON.stringify(event),
      name: event.guid
  };

  // execute step functions
  stepfunctions.startExecution(params, function(err, data) {
      if (err) {
          console.log(err, err.stack);
          callback(err);
      } else {
          console.log(data);
          callback(null, 'success');
      }
  });

};
