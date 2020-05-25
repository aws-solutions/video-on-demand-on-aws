/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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

exports.handler = async (event) => {
    console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`);

    const dynamo = new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION
    });

    const sns = new AWS.SNS({
        region: process.env.AWS_REGION
    });

    let guid,
        values,
        url,
        msg;

    if (event.function) {
        url = 'https://console.aws.amazon.com/cloudwatch/home?region=' + process.env.AWS_REGION + '#logStream:group=/aws/lambda/' + event.function;
        guid = event.guid;
        values = {
            ':st': 'Error',
            ':ea': event.function,
            ':em': event.error,
            ':ed': url
        };

        // Msg update to match DynamoDB entry
        msg = {
            guid: guid,
            workflowStatus: 'Error',
            workflowErrorAt: event.function,
            errorMessage: event.error,
            errorDetails: url
        };
    }

    if (event.detail) {
        url = 'https://console.aws.amazon.com/mediaconvert/home?region=' + process.env.AWS_REGION + '#/jobs/summary/' + event.detail.jobId;
        guid = event.detail.userMetadata.guid;
        values = {
            ':st': 'Error',
            ':ea': 'Encoding',
            ':em': JSON.stringify(event, null, 2),
            ':ed': url
        };

        // Msg update to match DynamoDB entry
        msg = {
            guid: guid,
            workflowStatus: 'Error',
            workflowErrorAt: 'Encoding',
            errorMessage: event.detail.errorMessage,
            errorDetails: url,
        };
    }

    console.log(JSON.stringify(msg, null, 2));

    // Update DynamoDB
    let params = {
        TableName: process.env.DynamoDBTable,
        Key: {
            guid: guid
        },
        UpdateExpression: 'SET workflowStatus = :st,' + 'workflowErrorAt = :ea,' + 'errorMessage = :em,' + 'errorDetails = :ed',
        ExpressionAttributeValues: values
    };

    await dynamo.update(params).promise();

    // Feature/so-vod-173 match SNS data structure with the SNS Notification
    // Function for consistency.
    params = {
        Message: JSON.stringify(msg, null, 2),
        Subject: ' workflow Status:: Error: ' + guid,
        TargetArn: process.env.SnsTopic
    };

    await sns.publish(params).promise();

    return event;
};
