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
const uuidv4 = require('uuid/v4');
const error = require('./lib/error.js');

exports.handler = async (event) => {
  console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`);

  const stepfunctions = new AWS.StepFunctions({
    region: process.env.AWS_REGION
  });

  const s3 = new AWS.S3({
    region: process.env.AWS_REGION
  });

  const s3metadata = async (bucket, key) => {
    try {
      let params = {
        Bucket: bucket,
        Key: key
      };
      const s3_response = await s3.headObject(params).promise().catch((err) => {
        console.error(`s3.headObject(${JSON.stringify(params)}) failed.`, err);
        return Promise.resolve({});
      });

      if (s3_response.Metadata) {
        return s3_response.Metadata;
      } else {
        return false;
      }
    } catch (e) {
      console.error("Could not execute s3:headObject", e);
    }
    return undefined;
  }

  let response;
  let params;

  try {
    switch (true) {
      case event.hasOwnProperty('Records'):
        // Ingest workflow triggered by s3 event::
        // if event originated from CMS, take its id, otherwise generate a uuid
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
        const bucket = event.Records[0].s3.bucket.name

        const metadata = await s3metadata(bucket, key)
        if (metadata) {
          console.log("metadata for item", metadata)
          if (metadata.hasOwnProperty("cms-id")) event.cmsId = metadata["cms-id"];
          if (metadata.hasOwnProperty("geo-restriction")) event.geoRestriction = metadata["geo-restriction"];
          if (metadata.hasOwnProperty("command-id")) event.cmsCommandId = metadata["command-id"];
        }
        event.guid = event.cmsCommandId || uuidv4();
        if (event.cmsCommandId) {
          // we're using the commandId here if possible,
          // but this may not be unique, so check if this run already exists (prevent error `ExecutionAlreadyExists`)
          let i = 0;
          while (true) {
            i += 1;
            if (i > 10) {
              event.guid = uuidv4();
              break;
            }
            try {
              const executionArn = `${process.env.IngestWorkflow}:${event.guid}`.replace(':stateMachine:', ':execution:');
              const data = await stepfunctions.describeExecution({executionArn: executionArn}).promise();
              console.log(`invalid guid found ${event.guid} : execution already exists with state ${data.status}.`);
              event.guid = `${event.cmsCommandId}__rerun_${i}`
            } catch (e) {
              console.log(`valid guid found ${event.guid}`);
              break;
            }
          }
        }


        // Identify file extension of s3 object::
        if (key.split('.').pop() === 'json') {
          event.workflowTrigger = 'Metadata';
        } else {
          event.workflowTrigger = 'Video';
        }
        params = {
          stateMachineArn: process.env.IngestWorkflow,
          input: JSON.stringify(event),
          name: event.guid
        };
        response = 'success';
        console.log("event", event);
        break;

      case event.hasOwnProperty('guid'):
        // Process Workflow trigger
        params = {
          stateMachineArn: process.env.ProcessWorkflow,
          input: JSON.stringify({
            guid: event.guid,
            cmsId: event.cmsId || 'undefined',
            cmsCommandId: event.cmsCommandId || 'undefined'
          }),
          name: event.guid
        };
        response = 'success';
        break;

      case event.hasOwnProperty('detail'):
        // Publish workflow triggered by MediaConvert CloudWatch event::
        params = {
          stateMachineArn: process.env.PublishWorkflow,
          input: JSON.stringify(event),
          name: event.detail.userMetadata.guid
        };
        response = 'success';
        break;

      default:
        throw new Error('invalid event object');
    }

    let data = await stepfunctions.startExecution(params).promise();
    console.log(`STATEMACHINE EXECUTE:: ${JSON.stringify(data, null, 2)}`);
  } catch (err) {
    await error.handler(event, err);
    throw err;
  }

  return response;
};