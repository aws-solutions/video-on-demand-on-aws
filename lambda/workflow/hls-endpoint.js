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

/*
Step function: Generate hls endpoint  & updates Dynamo with the joj ID
*/
'use strict';
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({
    region: process.env.AWS_REGION
});

exports.handler = (event, context, callback) => {

  var url = 'http://' + process.env.Cdn + '/' + event.guid + '/' + event.hlsOutput + '.m3u8';

  console.log(event);
  console.log(url);

  var params = {
      TableName: process.env.Dynamo,
      Key: {
          'guid': {'S': event.guid}
      },
      ExpressionAttributeValues: {
          ':cf': {S: url}
      },
      UpdateExpression: 'SET hlsUrl  = :cf'
  };

  dynamodb.updateItem(params, function(err, data) {
      if (err) {
          console.log(err, err.stack);
          callback(null, err);
      } else {
          callback(null, 'Done');
      }
  });

};
