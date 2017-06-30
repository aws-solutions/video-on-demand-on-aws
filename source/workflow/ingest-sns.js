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
 const sns = new AWS.SNS({region: process.env.AWS_REGION});

 exports.handler = (event, context, callback) => {
   console.log('Received event:', JSON.stringify(event, null, 2));

   let params = {
         TableName: process.env.DynamoDB,
         Key: {'guid': {'S': event.guid  }},
         ExpressionAttributeValues: {':status': {S: "Ingest"}},
         UpdateExpression: 'SET workflowStatus = :status'
       };


   let updateData = dynamodb.updateItem(params).promise();

   updateData.then(function(data) {

        let params = {
            Message: JSON.stringify(event, null, 2),
            Subject: process.env.AWS_LAMBDA_FUNCTION_NAME.slice(0, -11) + ' : Workflow started for guid:' + event.guid,
            TargetArn: process.env.StepsPublish
        };

        console.log('Sending SNS');

        sns.publish(params, function(err) {
          if (err) throw(err);
          else console.log('Workflow Started SNS sent');
        });
        callback(null, 'Success');

     }).catch(function(err) {
       console.log(err, err.stack);
       callback(err);
     });
 };
