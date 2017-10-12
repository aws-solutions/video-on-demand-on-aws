'use strict';
const os = require('os');
const AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const docClient = new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION
    });
    const sns = new AWS.SNS({
        region: process.env.AWS_REGION
    });

    let msg = JSON.parse(event.Records[0].Sns.Message);
    let accountId = event.Records[0].Sns.TopicArn.split(':')[4];
    let consoleUrl;
    let guid;
    let values;

    if (event.Records[0].Sns.Subject.includes('Transcoder')) {
      console.log('Processing ETS error');
      consoleUrl = 'https://console.aws.amazon.com/elastictranscoder/home?region=' + process.env.AWS_REGION + '#jobs:pipelineId=' + msg.pipelineId + ';ascendingOrder=false;numOfJobs=50';
      guid = msg.outputKeyPrefix.slice(0, -1);
      values = {
        ":st":"error",
        ":ea":"encoding",
        ":em":JSON.stringify(msg, null, 2)
      };
    }
    else {
      console.log('Processing workflow error');
      consoleUrl = 'https://console.aws.amazon.com/cloudwatch/home?region=' + process.env.AWS_REGION+'#logStream:group=/aws/lambda/'+msg.function;
      guid = msg.guid;
      values = {
        ":st":"error",
        ":ea": msg.function,
        ":em":msg.error
      };
    }

    let params = {
        TableName: process.env.DynamoDB,
        Key: {guid: guid},
        UpdateExpression: 'SET workflow_status = :st,' + 'workflow_error_at = :ea,' + 'error_message = :em',
        ExpressionAttributeValues: values
    };

    docClient.update(params).promise()
      .then(() => sns.publish({
        Message: 'Please see the AWS console for detail :' + consoleUrl + os.EOL + JSON.stringify(msg, null, 2),
        Subject: ' workflow error: ' + guid,
        TargetArn: process.env.NotificationSns
      }).promise())
      .then(() => callback(null, 'sucess'))
      .catch(err => {
        console.log(err);
        callback(err);
      });
};
