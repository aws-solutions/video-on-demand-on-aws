/*********************************************************************************************************************
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const AWS = require('aws-sdk');
const error = require('./lib/error.js');

exports.handler = async (event) => {
    console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`);

    const dynamo = new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION
    });

    try {
        // Remove guid from event data (primary db table key) and iterate over event objects
        // to build the update parameters
        let guid = event.guid;
        delete event.guid;
        let expression = '';
        let values = {};
        let i = 0;

        Object.keys(event).forEach((key) => {
            i++;
            expression += ' ' + key + ' = :' + i + ',';
            values[':' + i] = event[key];
        });

        let params = {
            TableName: process.env.DynamoDBTable,
            Key: {
                guid: guid,
            },
            // remove the trailing ',' from the update expression added by the forEach loop
            UpdateExpression: 'set ' + expression.slice(0, -1),
            ExpressionAttributeValues: values
        };

        console.log(`UPDATE:: ${JSON.stringify(params, null, 2)}`);
        await dynamo.update(params).promise();

        // Get updated data and reconst event data to return
        event.guid = guid;
    } catch (err) {
        await error.handler(event, err);
        throw err;
    }

    return event;
};
