/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const AWS = require('aws-sdk');
const error = require('./lib/error/error.js');
const logger = require('./lib/logger');

exports.handler = async (event) => {
  logger.registerEvent(event);
  logger.info("REQUEST", event);

  const dynamo = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
  });

  try {
    // Remove guid from event data (primary db table key) and iterate over event objects
    // to build the update parameters
    let key = event.cmsId || event.guid;
    const originalGuid = event.guid;
    // store the original guid, since we're using the cmsId if present
    event['execution_guid'] = originalGuid;
    delete event.guid;
    let expression = '';
    let values = {};

    Object.keys(event).forEach((key, index) => {
      // ttl is a reserved keyword
      expression += ' ' + (key !== 'ttl' ? key : `#${key}`) + ' = :' + index + ',';
      values[':' + index] = event[key];
    });

    let params = {
      TableName: process.env.DynamoDBTable,
      Key: {
        guid: key,
      },
      // remove the trailing ',' from the update expression added by the forEach loop
      UpdateExpression: 'set ' + expression.slice(0, -1),
      ExpressionAttributeValues: values
    };

    if (event.hasOwnProperty('ttl')) {
      params['ExpressionAttributeNames'] = {'#ttl': 'ttl'};
    }

    logger.info(`UPDATE:: ${JSON.stringify(params, null, 2)}`);
    await dynamo.update(params).promise();

    // Get updated data and reconst event data to return
    event.guid = originalGuid;
  } catch (err) {
    await error.handler(event, err);
    throw err;
  }

  return event;
};
