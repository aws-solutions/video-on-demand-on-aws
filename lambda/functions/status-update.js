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
Step function: Update workflow status in Dynamo to Encoding.
*/
'use strict';
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({
    region: process.env.AWS_REGION
});
const sns = new AWS.SNS({
    region: process.env.AWS_REGION
});

exports.handler = (event, context, callback) => {

    var params = {
        TableName: process.env.Dynamo,
        Key: {
            'guid': {
                'S': event.guid
            }
        },
        ExpressionAttributeValues: {
            ':status': {
                S: "Encoding"
            }
        },
        UpdateExpression: 'SET workflowStatus = :status'
    };

    // Update Status in dynamo
    dynamodb.updateItem(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            callback(err, 'Failed');
        } else
        {
          console.log('Updating Dynamo wrorkflow status to Encoding')

          var sns_params = {
              Message: JSON.stringify(event, null, 2),
              Subject: process.env.AWS_LAMBDA_FUNCTION_NAME.slice(0, -14) + ':Workflow started:' + event.guid,
              TargetArn: process.env.StepsPublish
          };

          sns.publish(sns_params, function(err, data) {
              if (err) {
                  console.log(err, err.stack);
                  callback(err, 'Failed');
              } else {
                  console.log('SNS Notification complete');
                  callback(null, 'Success');
              }
          });
          console.log(data);
          callback(null, 'Success');
        }
    });
};
