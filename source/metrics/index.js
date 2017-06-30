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

const response = require('cfn-response');
const MetricsHelper = require('./lib/metrics-helper.js');
const UUID = require('uuid');
const moment = require('moment');

exports.handler = function(event, context) {
  console.log('Received event:', JSON.stringify(event, null, 2));

  let responseData = {};
  let metricsHelper = new MetricsHelper();

  if (event.RequestType == "Delete") {
    if (event.ResourceProperties.customAction === 'sendMetric') {

      let metric = {
          Solution: event.ResourceProperties.solutionId,
          UUID: event.ResourceProperties.UUID,
          TimeStamp: moment().utc().format('YYYY-MM-DD HH:mm:ss.S'),
          Data: {
              Version: event.ResourceProperties.version,
              Deleted: moment().utc().format()
          }
      };
      metricsHelper.sendAnonymousMetric(metric, function(err, data) {
        if (err) {
          console.log(err, err.stack);
        } else {
          console.log('data sent');
          response.send(event, context, response.SUCCESS);
          return;
          }
        });
      }

      else {
        response.send(event, context, response.SUCCESS);
        return;
      }
    }

    else if (event.RequestType === 'Create') {
        if (event.ResourceProperties.customAction === 'createUuid') {

          responseData = {UUID: UUID.v4()};
          response.send(event, context, response.SUCCESS, responseData);
        }

        else if (event.ResourceProperties.customAction === 'sendMetric') {

          let metric = {
              Solution: event.ResourceProperties.solutionId,
              UUID: event.ResourceProperties.UUID,
              TimeStamp: moment().utc().format('YYYY-MM-DD HH:mm:ss.S'),
              Data: {
                  Version: event.ResourceProperties.version,
                  Launch: moment().utc().format()
              }
          };
          metricsHelper.sendAnonymousMetric(metric, function(err, data) {
            if (err) {
              console.log(err, err.stack);
            } else {
              console.log('data sent');
              response.send(event, context, response.SUCCESS);
              return;
              }
            });
        }

        else {
          response.send(event, context, response.SUCCESS);
        }
    }
  };
