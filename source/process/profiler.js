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
const AWS = require('aws-sdk');
const error = require('./lib/error.js');

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const docClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
  });

  //check the defined presets (resolution) are lessthan or equal to the source
  // height (resolution)

  function presetCheck(height,presets) {
    let newPresets = [];
    presets.forEach(function(p) {
      if (p <= height) {
        newPresets.push(p);
      } else {
        console.log(p+' removed from presets as the source is only', height,'p');
      }
    });
    return newPresets;
  }

  let params = {
    TableName: process.env.DynamoDBTable,
    Key: {
      guid: event.guid
    }
  };
  docClient.get(params).promise()
    .then(data => {
      Object.keys(data.Item).forEach(function(key) {
        event[key] = data.Item[key];
      });

      let info = JSON.parse(data.Item.srcMediainfo);
      event.srcHeight = info.video[0].height;
      event.srcWidth = info.video[0].width;
      //remove mediainfo to reduce payload
      delete event.srcMediainfo;

      if (data.Item.hls) {
        event.hls = presetCheck(event.srcHeight,data.Item.hls);
      }
      if (data.Item.mp4) {
        event.mp4 = presetCheck(event.srcHeight,data.Item.mp4);
      }
      if (data.Item.dash) {
        event.dash = presetCheck(event.srcHeight,data.Item.dash);
      }
      callback(null, event);
    })
    .catch(err => {
      error.handler(event, err);
      callback(err);
    });
};
