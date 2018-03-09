'use strict';
const AWS = require('aws-sdk');
const error = require('./lib/error.js');
const moment = require('moment');

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const docClient = new AWS.DynamoDB.DocumentClient({
            region: process.env.AWS_REGION
    });

    let params = {
        TableName: process.env.DynamoDBTable,
        Key: {
          guid: event.guid
        }
    };

    docClient.get(params).promise()
    .then(data => {
      // check if output count and preset count match
      let outputs=0;
      if (data.Item.hls && data.Item.hls.length > 0) outputs++;
      if (data.Item.dash && data.Item.dash.length > 0) outputs++;
      if (data.Item.mp4 && data.Item.mp4.length > 0) outputs++;

      let jobs=0;
      if (data.Item.hlsEtsMsg) jobs++;
      if (data.Item.dashEtsMsg) jobs++;
      if (data.Item.mp4EtsMsg) jobs++;

      if (outputs === jobs) {
        console.log('All encoding Jobs complete');
        event = data.Item;
        event.workflowStatus = 'complete';
        event.workflowEndTime = moment().utc().format('YYYY-MM-DD HH:mm.S');
      } else {
        console.log('Encoding Jobs outstanding')
        event.workflowStatus = 'encoding';
      }
      callback(null,event);
    })
    .catch(err => {
        error.handler(event, err);
        callback(err);
    });
};
