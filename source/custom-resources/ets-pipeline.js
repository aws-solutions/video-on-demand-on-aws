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
const elastictranscoder = new AWS.ElasticTranscoder({region: process.env.AWS_REGION});

exports.handler = function(event, context) {
  console.log('Received event:', JSON.stringify(event, null, 2));

  let responseData;
  let params;

  if (event.RequestType == "Delete") {
      params = {
          Id: event.PhysicalResourceId
      };
      elastictranscoder.deletePipeline(params, function(err, data) {
          if (err) {
              console.log(err, err.stack);
              responseData = err;
              response.send(event, context, response.FAILED, responseData);
          } else {
              console.log(data);
              response.send(event, context, response.SUCCESS);
          }
      });
  } else if (event.RequestType == "Create") {
      params = {
        InputBucket: event.ResourceProperties.Source,
        Name: event.ResourceProperties.Name,
        Role: event.ResourceProperties.Role,
        Notifications: {
            Completed: event.ResourceProperties.Complete,
            Error: event.ResourceProperties.Error,
            Progressing: event.ResourceProperties.Progress,
            Warning: event.ResourceProperties.Warning
        },
        OutputBucket: event.ResourceProperties.Dest,
      };

      elastictranscoder.createPipeline(params, function(err, data) {
          if (err) {
              console.log(err, err.stack);
              responseData = err;
              response.send(event, context, response.FAILED, responseData);
          } else {
              console.log(data);
              responseData = {
                  PipelineId: data.Pipeline.Id
              };
              response.send(event, context, response.SUCCESS, responseData, data.Pipeline.Id);
          }
      });
  }
};
