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
const https = require('https');
const error = require('./lib/error.js');
const axios = require('axios');

const SsmHostKey = '/external/livingdocs/cms.base-url';
const SsmTokenKey = '/external/livingdocs/cms.token';

exports.handler = async (event) => {
  console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`);

  if (!event.hasOwnProperty('cmsId')) {
    console.log("Event does contain a 'cmsId'.", event);
    return event;
  }

  const sns = new AWS.SNS({
    region: process.env.AWS_REGION
  });

  const ssm = new AWS.SSM({
    region: process.env.AWS_REGION
  });

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

    const reqForDependencies = await axios(getRequest);
    if (reqForDependencies.status === 200) {
      console.log("reqForDependencies.data", reqForDependencies.data);
      for (const dependency of reqForDependencies.data) {

        console.log(`notifying ${process.env.SnsTopic.split(':').pop()} -> ${dependency.id.toString()}`);
        let snsParams = {
          Message: dependency.id.toString(),
          Subject: dependency.id.toString(),
          TargetArn: process.env.SnsTopic
        };
        await sns.publish(snsParams).promise();
      }

    } else {
      console.log(`cms responded with http/${reqForDependencies.status} for media-id:'${event.cmsId}'`);
    }

  } catch (err) {
    await error.handler(event, err);
    throw err;
  }
  return event;
};
