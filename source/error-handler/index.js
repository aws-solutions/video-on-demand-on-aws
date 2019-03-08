/***********************************************************************************************
 *  Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Amazon Software License (the "License"). You may not use
 *  this file except in compliance with the License. A copy of the License is located at
 *
 *      http://aws.amazon.com/asl/
 *
 *  or in the "license" file accompanying this file. This file is distributed on an "AS IS"
 *  BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License
 *  for the specific language governing permissions and limitations under the License.
 *                                                                                 *
 * @author Solution Builders
 * @function errorHandler
 * @description triggered by a failed encoding job or workflow lambda function, send a
 * SNS notification and update the DynamoDB table.
 *
 *********************************************************************************************/

const os = require('os');
const AWS = require('aws-sdk');

exports.handler = async (event) => {
	console.log('REQUEST:: ', JSON.stringify(event, null, 2));

	const dynamo = new AWS.DynamoDB.DocumentClient({
		region: process.env.AWS_REGION
	});
	const sns = new AWS.SNS({
		region: process.env.AWS_REGION
	});

	try {

		let guid;
		let values;
		let url;

		if (event.function) {
			url = 'https://console.aws.amazon.com/cloudwatch/home?region=' + process.env.AWS_REGION + '#logStream:group=/aws/lambda/' + event.function;
			guid = event.guid;
			values = {
				":st": "error",
				":ea": event.function,
				":em": event.error
			};
		}

		if (event.detail) {
			url = 'https://console.aws.amazon.com/mediaconvert/home?region=' + process.env.AWS_REGION + '#/jobs/summary/' + event.detail.jobId;
			guid = event.detail.userMetadata.guid;
			values = {
				":st": "error",
				":ea": "encoding",
				":em": JSON.stringify(event, null, 2)
			};
		}
		//Update DynamoDB
		let params = {
			TableName: process.env.DynamoDBTable,
			Key: {
				guid: guid
			},
			UpdateExpression: 'SET workflowStatus = :st,' + 'workflowErrorAt = :ea,' + 'errorMessage = :em',
			ExpressionAttributeValues: values
		};
		await dynamo.update(params).promise();

		//Send SNS notification
		let msg = {
			workflowStatus: 'error',
			guid: guid
		};
		let snsParams = {
			Message: JSON.stringify(msg, null, 2),
			Subject: ' workflow error: ' + guid,
			TargetArn: process.env.SnsTopic
		};
		await sns.publish(snsParams).promise();
	} catch (err) {
		console.log(err);
		throw err;
	}
	return event;
};
