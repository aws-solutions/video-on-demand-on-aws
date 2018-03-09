'use strict';
const AWS = require('aws-sdk');
const error = require('./lib/error.js');

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const s3 = new AWS.S3();

  function tagObject(key) {
    let response = new Promise((res, reject) => {
      let params = {
        Bucket: event.srcBucket,
        Key: key,
        Tagging: {
          TagSet: [
            {
              Key: "guid",
              Value: event.guid
            },
            {
              Key: process.env.AWS_LAMBDA_FUNCTION_NAME.slice(0, -8),
              Value: 'archive'
            }
          ]
        }
      };
      s3.putObjectTagging(params, function(err, data) {
        if (err) reject(err);
        else {
          res(data);
        }
      });
    });
    return response;
  }

  let promises = [];

  promises.push(tagObject(event.srcVideo));
  if (event.srcMetadataFile) {
    promises.push(tagObject(event.srcMetadataFile));
  }

  Promise.all(promises)
    .then(() => callback(null, event))
    .catch(err => {
      error.handler(event, err);
      callback(err);
    });
};
