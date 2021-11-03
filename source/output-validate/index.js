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
const moment = require('moment');
const path = require('path');

const buildUrl = (originalValue) => originalValue.slice(5).split('/').splice(1).join('/');

async function* listAllKeys(s3, params) {
  params = {...params};
  do {
    const data = await s3.listObjectsV2(params).promise();
    params.ContinuationToken = data.NextContinuationToken;
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

  let data = {};

  try {
    // Get Config from DynamoDB (data required for the workflow)
    const ddbParams = {
      TableName: process.env.DynamoDBTable,
      Key: {
        guid: event.detail.userMetadata.cmsId || event.detail.userMetadata.guid,
      }
    };

    data = await dynamo.get(ddbParams).promise();
    data = data.Item;

    data.encodingOutput = event;
    data.guid = event.detail.userMetadata.guid;
    data.workflowStatus = 'Complete';
    data.endTime = moment().utc().toISOString();

    const isGeoRestricted = ('DE' === data.geoRestriction) || false
    const cloudFront = isGeoRestricted ? process.env.CloudFrontRestricted : process.env.CloudFront

    // Parse MediaConvert Output and generate CloudFront URLS.
    event.detail.outputGroupDetails.forEach(output => {
      logger.info(`${output.type} found in outputs`);

      switch (output.type) {
        case 'HLS_GROUP':
          data.hlsPlaylist = output.playlistFilePaths[0];
          data.hlsUrl = `https://${cloudFront}/${buildUrl(data.hlsPlaylist)}`;

          break;

        case 'DASH_ISO_GROUP':
          data.dashPlaylist = output.playlistFilePaths[0];
          data.dashUrl = `https://${cloudFront}/${buildUrl(data.dashPlaylist)}`;

          break;

        case 'FILE_GROUP':
          let files = [];
          let urls = [];
          output.outputDetails.forEach((file) => {

            if (file.outputFilePaths) {
              files.push(file.outputFilePaths[0]);
              urls.push(`https://${cloudFront}/${buildUrl(file.outputFilePaths[0])}`);
            }
          });

          if (files.length > 0 && files[0].split('.').pop() === 'mp4') {
            data.mp4Outputs = files;
            data.mp4Urls = urls;
          }

          break;

        case 'MS_SMOOTH_GROUP':
          data.mssPlaylist = output.playlistFilePaths[0];
          data.mssUrl = `https://${cloudFront}/${buildUrl(data.mssPlaylist)}`;

          break;

        case 'CMAF_GROUP':
          data.cmafDashPlaylist = output.playlistFilePaths[0];
          data.cmafDashUrl = `https://${cloudFront}/${buildUrl(data.cmafDashPlaylist)}`;

          data.cmafHlsPlaylist = output.playlistFilePaths[1];
          data.cmafHlsUrl = `https://${cloudFront}/${buildUrl(data.cmafHlsPlaylist)}`;

          break;

        default:
          throw new Error('Could not parse MediaConvert output');
      }
    });

    /**
     * feature: if frame capture and accelerated are both enabled the thumbnails are not listed in the CloudWatch
     * output. adding a function to get the last image from the list of images.
     */
    const prefix = data.srcVideo.substring(0, data.srcVideo.lastIndexOf("/"))
      + (data.hasOwnProperty('cmsId') ? '' : '/' + data.guid);
    const bucket = isGeoRestricted ? process.env.DestinationRestricted : process.env.Destination;

    if (data.frameCapture) {

      data.thumbNails = [];
      data.thumbNailsUrls = [];

      const params = {
        Bucket: bucket,
        Prefix: `${prefix}/thumbnails/`,
      };

      let thumbNails = await s3.listObjectsV2(params).promise();

      if (thumbNails.Contents.length !== 0) {
        let lastImg = thumbNails.Contents.pop();
        data.thumbNails = [...data.thumbNails, `s3://${bucket}/${lastImg.Key}`];
        data.thumbNailsUrls = [...data.thumbNailsUrls, `https://${cloudFront}/${lastImg.Key}`];
      } else {
        throw new Error('MediaConvert Thumbnails not found in S3');
      }
    }

    /*
     * copy s3 metadata, cache control and/or expires from the original file to all generated files.
     */
    const headParams = {
      Bucket: data.srcBucket,
      Key: data.srcVideo,
    };
    const master = await s3.headObject(headParams).promise();

    const listParams = {
      Bucket: bucket,
      Prefix: `${prefix}/`,
    };
    // find all generated files: *.m3u8, *.ts and *.jpg
    for await (const listItem of listAllKeys(s3, listParams)) {
      const result = await Promise.all(listItem.Contents.map(async item => {
        let contentType;
        switch (path.extname(item.Key).substring(1)) {
          case 'm3u8':
            contentType = 'application/vnd.apple.mpegurl';
            break
          case 'ts':
            contentType = 'video/MP2T';
            break
          case 'jpg':
            contentType = 'image/jpeg';
            break
          default:
            contentType = 'application/octet-stream';
        }
        const copyParams = {
          Bucket: bucket,
          CopySource: `${bucket}/${item.Key}`,
          Key: item.Key,
          MetadataDirective: "REPLACE",
          Metadata: {...master.Metadata},
          ContentType: contentType
        };
        if (master.hasOwnProperty('CacheControl')) {
          copyParams['CacheControl'] = master.CacheControl;
        } else if (master.hasOwnProperty('Expires')) {
          copyParams['Expires'] = master.Expires;
        }

        return await s3.copyObject(copyParams).promise();
      }));
    }

  } catch (err) {
    await error.handler(event, err);
    throw err;
  }
  return data;
};
