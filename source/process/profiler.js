'use strict';
const AWS = require('aws-sdk');
const error = require('./lib/error.js');

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const docClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
  });

  function presetCheck(presets) {
    let newPresets = [];
    presets.forEach(function(p) {
      if (p <= event.height) {
        newPresets.push(p);
      }
    });
    return newPresets;
  }

  let params = {
    TableName: process.env.DynamoDB,
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
      event.height = info.$videoES[0].height;

      if (event.upscaling) {
        console.log('Upscaling enabled, skipping preset check');
        callback(null, event);
      } else {
        if (data.Item.hls) {
          event.hls = presetCheck(data.Item.hls);
        }
        if (data.Item.mp4) {
          event.mp4 = presetCheck(data.Item.mp4);
        }
        if (data.Item.dash) {
          event.dash = presetCheck(data.Item.dash);
        }
        callback(null, event);
      }
    })

    .catch(err => {
      error.sns(event, err);
      callback(err);
    });
};
