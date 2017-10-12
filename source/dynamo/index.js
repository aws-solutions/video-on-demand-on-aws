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
 const error = require('./lib/error.js');

 exports.handler = (event, context, callback) => {
     console.log('Received event:', JSON.stringify(event, null, 2));

     const docClient = new AWS.DynamoDB.DocumentClient({
         region: process.env.AWS_REGION
     });

     let guid = event.guid;
     delete event.guid;
     let expression = '';
     let values = {};
     let i = 0;

     Object.keys(event).forEach(function(key) {
         i++;
         expression += ' ' + key + ' = :' + i + ',';
         values[':' + i] = event[key];
     });

     let params = {
         TableName: process.env.DynamoDB,
         Key: {
             guid: guid,
         },
         // remove the trailing ',' from the update expression added by the forEach loop
         UpdateExpression: 'set ' + expression.slice(0, -1),
         ExpressionAttributeValues: values
     };
     console.log('Dynamo update: ', JSON.stringify(params, null, 2));

     docClient.update(params).promise()
       .then(() => {
           event.guid = guid;
           callback(null, event);
       })
       .catch(err => {
           error.sns(event, err);
           callback(err);
       });
 };
