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
const error = require('./lib/error/error');
const logger = require('./lib/logger');

async function* listAllKeys(s3, params) {
  params = {...params};
  do {
    const data = await s3.listObjectsV2(params).promise();
    params = {...params, ContinuationToken: data.NextContinuationToken};
    yield data;
  } while (params.ContinuationToken);
}

exports.handler = async (event) => {
  logger.registerEvent(event);
  logger.info("REQUEST", event);

  const dynamo = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
  });

  const s3 = new AWS.S3({
    region: process.env.AWS_REGION
  });

  const dest_buckets = new Set([process.env.DestinationRestricted, process.env.Destination]);

  try {

    const key = event.srcVideo;

    // extract cms id from obj key
    //  match.groups.media_id the cms media id
    //  match.groups.prefix the prefix of this item, e.g. 2021/09/$MEDIA_ID/
    //  ~> the prefix could be used to invalidate some CDN URLs if required later
    const match = key.match(/^(?<prefix>20\d{2}\/\d{2}\/(?<media_id>[\w-]+)\/)/)

    if (match && match.groups.prefix && match.groups.media_id) {

      for (let dest_bucket of dest_buckets) {
        const s3ListParams = {
          Bucket: dest_bucket,
          Prefix: match.groups.prefix
        };

        for await (const listItem of listAllKeys(s3, s3ListParams)) {
          logger.info(`s3:delete: Found #${listItem.Contents.length} items for 's3://${dest_bucket}/${match.groups.prefix}'.`)
          await Promise.all(listItem.Contents.map(async item => {
            const s3DeleteParams = {
              Bucket: dest_bucket,
              Key: item.Key
            };
            logger.info('s3:deleting:', s3DeleteParams);
            try {
              return await s3.deleteObject(s3DeleteParams).promise();
            } catch (e) {
              logger.error(`Cannot delete ${JSON.stringify(s3DeleteParams)}`, e);
              throw e;
            }
          }));
        }
      }

      const ddbParams = {
        TableName: process.env.DynamoDBTable,
        Key: {
          guid: match.groups.media_id
        }
      }
      logger.info('ddb:deleting:', ddbParams);
      try {
        await dynamo.delete(ddbParams).promise();
      } catch (e) {
        logger.error(`Cannot delete ddb: ${JSON.stringify(ddbParams)}`, e);
        throw e;
      }
    } else {
      logger.info(`Could not extract cms id from key='${key}'`)
    }

  } catch (err) {
    await error.handler(event, err);
    throw err;
  }

  return event;
};
