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
const dynamodb = new AWS.DynamoDB({region: process.env.AWS_REGION});

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  let params = {
        TableName: process.env.DynamoDB,
        Key: {'guid': {'S': event.guid}}
      };

  let getData = dynamodb.getItem(params).promise();

  getData.then(function(data) {

    let mediainfo = JSON.parse(data.Item.srcMediainfo.S);
    let height = mediainfo.$videoES[0].height;
    let profile;

    switch (true) {
        case height >= 1080:
            profile = '1080';
            break;
        case height >= 720:
            profile = '720';
            break;
        case height >= 540:
            profile = '540';
            break;
        case height >= 432:
            profile = '432';
            break;
        case height >= 360:
            profile = '360';
            break;
        case height >= 270:
            profile = '270';
            break;
        case height >= 234:
            profile = '234';
            break;
        default:
            console.log(event.profile + 'Error profile note set');
    }

    console.log('Video height: ' + height + 'p setting profile to' + profile );

    params = {
      TableName: process.env.DynamoDB,
      Key: {'guid': {'S': event.guid}},
      ExpressionAttributeValues: {':pf': {S: profile}},
      UpdateExpression: 'SET profile = :pf'
    };

    dynamodb.updateItem(params, function(err, data) {
      if (err) throw(err);
      else {
        let json = {
            "guid": event.guid,
            "srcBucket": event.srcBucket,
            "srcVideo": event.srcVideo,
            "profile": profile
        };
        console.log('updated output:', JSON.stringify(json, null, 2));
        callback(null, json);
      }
    });

    }).catch(function(err) {
      console.log(err, err.stack);
      callback(err);
      }
    );
};
