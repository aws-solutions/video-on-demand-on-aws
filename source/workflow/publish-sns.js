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
const MetricsHelper = require('./lib/metrics-helper.js');
const moment = require('moment');
const metricsHelper = new MetricsHelper();
const dynamodb = new AWS.DynamoDB({region: process.env.AWS_REGION});
const sns = new AWS.SNS({region: process.env.AWS_REGION});

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

  let time = moment().utc().format('YYYY-MM-DD HH:mm:ss.S');

  let getData = function() {
    return new Promise(function(res) {
      let params = {
              TableName: process.env.DynamoDB,
              Key: {"guid": {S: event.guid}}
            };

      dynamodb.getItem(params, function(err,data){
        if (err) {
          console.log(err);
        }
        else if (data.Item.mp4Metadata && data.Item.hlsUrl) {
          let json = {
                "guid": data.Item.guid.S,
                "srcVideo": data.Item.srcVideo.S,
                "mp4Output": data.Item.mp4Output.S,
                "mp4Metadata": data.Item.mp4Output.S.slice(0, -3) + 'json',
                "hlsOutput": data.Item.hlsOutput.S,
                "hlsUrl": data.Item.hlsUrl.S,
                "profile": data.Item.profile.S,
                "srcBucket": data.Item.srcBucket.S,
                "mp4Bucket": data.Item.mp4Bucket.S,
                "hlsBucket": data.Item.hlsBucket.S,
                "startTime": data.Item.startTime.S,
                "completeTime": time
              };

          let srcMediainfo = JSON.parse(data.Item.srcMediainfo.S);
          delete srcMediainfo.$fileName;
          delete srcMediainfo.$rawData;
          delete srcMediainfo.$xmlParserInstance;

          let metricsData = {
            "profile": data.Item.profile.S,
            "startTime": data.Item.startTime.S,
            "srcSize":data.Item.srcSize.S,
            "mp4Size":data.Item.mp4Size.S,
            "completeTime": time,
            "srcMediainfo":srcMediainfo
          };
          res([json,metricsData]);
        }
        else {
          res('encoding');
        }
      });
    });
  };

  getData().then(function(res) {
    if (res === 'encoding') {
      console.log("1 oustanding encode job remaining");
      callback(null,'success');
    }
    else {
      console.log('Sending SNS : ', JSON.stringify(res[0],null, 2));
      let params = {
            Message: JSON.stringify(res[0], null, 2),
            Subject: process.env.AWS_LAMBDA_FUNCTION_NAME.slice(0, -12) +': Workflow complete for guid:' + event.guid,
            TargetArn: process.env.StepsPublish
          };
      sns.publish(params, function(err) {
        if (err) throw(err);
        else console.log('SNS sent');
      });

      if (process.env.anonymousData === 'Yes') {
        console.log('Sending anonymous data: ', JSON.stringify(res[1],null, 2));
        let metric = {
              Solution: 'SO0021',
              UUID: process.env.UUID,
              TimeStamp: time,
              Data: res[1]
            };
        metricsHelper.sendAnonymousMetric(metric, function(err) {
          if (err) throw(err);
          else console.log('anonymous data sent');
        });
      }

      params = {
            TableName: process.env.DynamoDB,
            Key: {"guid": {S: event.guid}},
            ExpressionAttributeValues: {':status': {S: "Complete"},':time': {S:time}},
            UpdateExpression: 'SET workflowStatus = :status,' + 'completeTime = :time'
          };
      dynamodb.updateItem(params, function(err) {
        if (err) throw(err);
        else console.log('DynamoDB updated and workflow complete');
      });
      callback(null,'success');
    }
}).catch(function(err) {
  console.log(err, err.stack);
  callback(err);
  }
);
};
