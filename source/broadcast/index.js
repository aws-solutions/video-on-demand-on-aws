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
const axios = require('axios');
const path = require('path');

const SsmHostKey = '/external/livingdocs/cms.base-url';
const SsmTokenKey = '/external/livingdocs/cms.token';

exports.handler = async (event) => {
  logger.registerEvent(event);
  logger.info("REQUEST", event);

  if (!event.hasOwnProperty('cmsId')) {
    logger.error("Event is missing a 'cmsId'.", event);
    throw event;
  }

  const sns = new AWS.SNS({
    region: process.env.AWS_REGION
  });

  const ssm = new AWS.SSM({
    region: process.env.AWS_REGION
  });

  const cloudFront = new AWS.CloudFront();

  const invalidationParams = {
    'DistributionId': process.env.DistributionId,
    'InvalidationBatch': {
      'CallerReference': event.guid, // Same caller reference will return existing invalidations
      'Paths': {
        'Quantity': 1,
        'Items': [`/${path.dirname(event.srcVideo)}/*`]
      }
    }
  }

  const ssmParams = {
    Names: [SsmHostKey, SsmTokenKey],
    WithDecryption: true
  };

  try {
    const secrets = await ssm.getParameters(ssmParams).promise();
    const host = secrets.Parameters.find(p => p.Name === SsmHostKey).Value;
    const bearer = secrets.Parameters.find(p => p.Name === SsmTokenKey).Value;

    const getRequest = {
      headers: {
        'Authorization': `Bearer ${bearer}`,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip'
      },
      url: `${host}/api/beta/mediaLibrary/${event.cmsId}/incomingDocumentReferences`,
      method: 'GET'
    };

    logger.info(`Invalidating ${JSON.stringify(invalidationParams)}`)
    const invalidation = await cloudFront.createInvalidation(invalidationParams).promise()
    logger.info(`Invalidated with ${JSON.stringify(invalidation)}`)

    const reqForDependencies = await axios(getRequest);
    if (reqForDependencies.status === 200) {
      logger.info("reqForDependencies.data", reqForDependencies.data);
      for (const dependency of reqForDependencies.data) {

        const message = dependency.id.toString();
        const topic_arn = process.env.SnsTopic;
        logger.info(`notifying ${topic_arn.split(':').pop()} -> ${message}`);
        let snsParams = {
          Message: message,
          Subject: message,
          TargetArn: topic_arn
        };
        if (topic_arn.endsWith(".fifo")) {
          snsParams = {...snsParams,
            MessageDeduplicationId: message,
            MessageGroupId: message};
        }
        await sns.publish(snsParams).promise();
      }

    } else {
      logger.error(`cms responded with http/${reqForDependencies.status} for media-id:'${event.cmsId}'`);
    }

  } catch (err) {
    await error.handler(event, err);
    throw err;
  }
  return event;
};
