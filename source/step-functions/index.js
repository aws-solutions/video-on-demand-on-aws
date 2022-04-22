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
const error = require('./lib/error/error');
const logger = require('./lib/logger');

exports.handler = async (event) => {
  logger.registerEvent(event);
  logger.debug("REQUEST", event);

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
        logger.error(`s3.headObject(${JSON.stringify(params)}) failed.`, err);
        return Promise.resolve({});
      });

      if (s3_response.Metadata) {
        return s3_response.Metadata;
      } else {
        return false;
      }
    } catch (e) {
      logger.error("Could not execute s3:headObject", e);
    }
    return undefined;
  };

  const find_unused_execution_id = async (execution_id) => {
    // we're using the commandId here if possible,
    // but this may not be unique, so check if this run already exists (prevent error `ExecutionAlreadyExists`)
    let i = 0;
    while (true) {
      const id_to_be_tested = i === 0 ? execution_id : `${execution_id}__rerun_${i}`;
      i += 1;
      if (i > 50) {
        break;
      }
      try {
        const executionArn = `${process.env.IngestWorkflow}:${id_to_be_tested}`.replace(':stateMachine:', ':execution:');
        const execution = await stepfunctions.describeExecution({executionArn: executionArn}).promise();
        logger.trace(`${id_to_be_tested} : execution already exists with state ${execution.status}.`);
      } catch (e) {
        if (e.code === 'ExecutionDoesNotExist') {
          logger.trace(`unused execution arn found ${id_to_be_tested}`);
          return id_to_be_tested;
        } else {
          logger.error("Something went wrong while searching for an available id.", e);
        }
      }
    }
    return uuidv4();
  };

  let response;
  let params;

  try {
    switch (true) {
      case event.hasOwnProperty('Records'):
        // Ingest workflow triggered by s3 event::
        // if event originated from CMS, take its id, otherwise generate a uuid
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
        const bucket = event.Records[0].s3.bucket.name;
        if (event.Records[0].eventName.startsWith('ObjectCreated:')) {
          event.doPurge = false;
          const metadata = await s3metadata(bucket, key);
          if (metadata) {
            logger.debug("metadata for item", metadata);
            if (metadata.hasOwnProperty("cms-id")) event.cmsId = metadata["cms-id"];
            if (metadata.hasOwnProperty("geo-restriction")) event.geoRestriction = metadata["geo-restriction"];
            if (metadata.hasOwnProperty("command-id")) event.cmsCommandId = metadata["command-id"];
            if (metadata.hasOwnProperty("ttl")) event.ttl = parseInt(metadata["ttl"], 10);
          } else {
            // this may occur during a re-run of a failed workflow, in this case at least extract the media_id
            const match = key.match(/^20\d{2}\/\d{2}\/(?<media_id>[\w-]+)\//);
            if (match && match.groups.media_id) {
              event.cmsId = match.groups.media_id;
            }
          }

          event.guid = event.cmsCommandId || uuidv4();
          if (event.cmsCommandId) {
            event.guid = await find_unused_execution_id(event.cmsCommandId);
          }
        } else if (event.Records[0].eventName.startsWith('ObjectRemoved:')) {
          event.doPurge = true;
          logger.info(`marking ${bucket}/${key} for purging since eventName=${event.Records[0].eventName}`);
          const match = key.match(/^20\d{2}\/\d{2}\/(?<media_id>[\w-]+)\//);
          if (match && match.groups.media_id) {
            event.cmsId = match.groups.media_id;
            event.guid = await find_unused_execution_id(match.groups.media_id);
            event.cmsCommandId = match.groups.media_id;
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

    logger.info("params", params);
    let data = await stepfunctions.startExecution(params).promise();
    logger.registerEvent(event);
    logger.info("event", event);
    logger.info("STATEMACHINE EXECUTE", data);
  } catch (err) {
    await error.handler(event, err);
    throw err;
  }

  return response;
};