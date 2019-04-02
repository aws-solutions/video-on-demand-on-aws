/*******************************************************************************
* Copyright 2019 Amazon.com, Inc. and its affiliates. All Rights Reserved.
*
* Licensed under the Amazon Software License (the "License").
* You may not use this file except in compliance with the License.
* A copy of the License is located at
*
*   http://aws.amazon.com/asl/
*
* or in the "license" file accompanying this file. This file is distributed
* on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
* express or implied. See the License for the specific language governing
* permissions and limitations under the License.
*
********************************************************************************/
const AWS = require('aws-sdk');
const error = require('./lib/error.js');
const moment = require('moment');

exports.handler = async (event) => {
  console.log('REQUEST:: ', JSON.stringify(event, null, 2));

  const dynamo = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
  });

  let data = {};

  try {
    // Get Config from DynamoDB (data required for the workflow)
    let params = {
      TableName: process.env.DynamoDBTable,
      Key: {
        guid: event.detail.userMetadata.guid,
      }
    };
    data = await dynamo.get(params).promise();
    data = data.Item;

    data.encodingOutput = event;
    data.workflowStatus = 'Complete';
    data.EndTime = moment().utc().format('YYYY-MM-DD HH:mm.S');

    //Parse MediaConvert Output and generate CloudFront URLS.
    event.detail.outputGroupDetails.forEach((output) => {

      switch (output.type) {
        case 'HLS_GROUP':
    			console.log(output.type,'found in outputs');
    			data.hlsPlaylist = output.playlistFilePaths[0];
    			data.hlsUrl = 'https://'+data.cloudFront+'/'+data.hlsPlaylist.slice(5).split('/').splice(1,3).join('/');
    			break;

    		case 'DASH_ISO_GROUP':
    			console.log(output.type,'found in outputs');
    			data.dashPlaylist = output.playlistFilePaths[0];
    			data.dashUrl = 'https://'+data.cloudFront+'/'+data.dashPlaylist.slice(5).split('/').splice(1,3).join('/');
    			break;

    		case 'FILE_GROUP':
    			console.log(output.type,'found in outputs');

          let files = [];
          let urls = [];
          output.outputDetails.forEach((file) => {
            files.push(file.outputFilePaths[0]);
            urls.push('https://'+data.cloudFront+'/'+file.outputFilePaths[0].slice(5).split('/').splice(1,3).join('/'));
          });
          if (files[0].split('.').pop() === 'mp4') {
            data.mp4Outputs = files;
            data.mp4Urls = urls;
          }
          if (files[0].split('.').pop() === 'jpg') {
            data.thumbNail = files;
            data.thumbNailUrl = urls;
          }
    			break;

        case 'MS_SMOOTH_GROUP':
          console.log(output.type,'found in outputs');
          data.mssPlaylist = output.playlistFilePaths[0];
          data.mssUrl = 'https://'+data.cloudFront+'/'+data.mssPlaylist.slice(5).split('/').splice(1,3).join('/');
          break;

        case 'CMAF_GROUP':
          console.log(output.type,'found in outputs');
          data.cmafDashPlaylist = output.playlistFilePaths[0];
          data.cmafDashUrl = 'https://'+data.cloudFront+'/'+data.cmafDashPlaylist.slice(5).split('/').splice(1,3).join('/');
          data.cmafHlsPlaylist = output.playlistFilePaths[1];
          data.cmafHlsUrl = 'https://'+data.cloudFront+'/'+data.cmafHlsPlaylist.slice(5).split('/').splice(1,3).join('/');
          break;

        default:
          throw new Error('Could not parse MediaConvert Output');
      }
    });
  }
  catch (err) {
    console.log(err);
    await error.handler(event, err);
    throw err;
  }
  return data;
};
