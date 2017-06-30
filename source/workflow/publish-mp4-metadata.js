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
 const child_process = require('child_process');
 const AWS = require('aws-sdk');
 const s3 = new AWS.S3();
 const dynamodb = new AWS.DynamoDB({
     region: process.env.AWS_REGION
 });

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  //ets jobs can finsish at the same time for small files (< 100mb), delaying workflow to avoid
  //publish sns from send complte notification twice.
  child_process.execSync("sleep 8");

  let ets_output;
  let time;

  if (event.preset == 'hls') {
      ets_output = 'hlsOutput';
      time = 'hlsEncodingTime';
  } else {
      ets_output = 'mp4Output';
      time = 'mp4EncodingTime';
  }

    let params = {
        TableName: process.env.DynamoDB,
        Key: {'guid': {'S': event.guid}},
    };

    let getData = dynamodb.getItem(params).promise();

    getData.then(function(data) {

      let info = JSON.parse(data.Item.mp4Mediainfo.S);
      let mp4size = info.$container.fileSize.toString();
      let json = {
        "Guid":event.guid,
          "File": event.output.slice(37),
          "Container": info.$container,
          "Video": info.$videoES,
          "Audio": info.$audioES,
          "Subtitles": info.$textES
      };

      console.log('Generated metadata:', JSON.stringify(json, null, 2));

      params = {
          Bucket: process.env.Mp4Dest,
          Key: event.output.slice(0, -4) + '.json',
          Body: JSON.stringify(json, null, 2),
      };

      s3.putObject(params, function(err, data) {
        if (err) throw(err);
        else {
          params = {
              TableName: process.env.DynamoDB,
              Key: {'guid': {'S': event.guid}},
              ExpressionAttributeValues: {':metadata': {S: JSON.stringify(json)},':size': {S: mp4size}},
              UpdateExpression: 'SET mp4Metadata = :metadata, mp4Size = :size'
          };
          dynamodb.updateItem(params, function(err, data) {
            if (err) throw(err);
            else console.log('anonymous data sent');
          });
        }
      });

      callback(null, 'Success');

      }).catch(function(err) {
        console.log(err, err.stack);
        callback(err);
        }
      );
  };
