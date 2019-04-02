/*******************************************************************************
* Copyright 2019 Amazon.com, Inc. and its affiliates. All Rights Reserved.
*
* Licensed under the Amazon Software License (the "License").
* You may not use this file except in compliance with the License.
* A copy of the License is located at
*
*   http://aws.amazon.com/asl/
*
* or in the "license" file accompanying this file. This file is distributed
* on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
* express or implied. See the License for the specific language governing
* permissions and limitations under the License.
*
********************************************************************************/
const AWS = require('aws-sdk');

let PutNotification = async (config) => {
	const s3 = new AWS.S3({});

	try {

		let params;

		switch(config.WorkflowTrigger) {

			case 'VideoFile':
				params = {
					Bucket: config.Source,
					NotificationConfiguration: {
						LambdaFunctionConfigurations: [{
								Events: ['s3:ObjectCreated:*'],
								LambdaFunctionArn: config.IngestArn,
								Filter: {
									Key: {
										FilterRules: [{
											Name: 'suffix',
											Value: '.mpg'
										}]
									}
								}
							},
							{
								Events: ['s3:ObjectCreated:*'],
								LambdaFunctionArn: config.IngestArn,
								Filter: {
									Key: {
										FilterRules: [{
											Name: 'suffix',
											Value: '.mp4'
										}]
									}
								}
							},
							{
								Events: ['s3:ObjectCreated:*'],
								LambdaFunctionArn: config.IngestArn,
								Filter: {
									Key: {
										FilterRules: [{
											Name: 'suffix',
											Value: '.mv4'
										}]
									}
								}
							},
							{
								Events: ['s3:ObjectCreated:*'],
								LambdaFunctionArn: config.IngestArn,
								Filter: {
									Key: {
										FilterRules: [{
											Name: 'suffix',
											Value: '.mov'
										}]
									}
								}
							},
							{
								Events: ['s3:ObjectCreated:*'],
								LambdaFunctionArn: config.IngestArn,
								Filter: {
									Key: {
										FilterRules: [{
											Name: 'suffix',
											Value: '.m2ts'
										}]
									}
								}
							}
						]
					}
				};
				console.log('configuring S3 event for Video')
				await s3.putBucketNotificationConfiguration(params).promise();
				break;

			case 'MetadataFile':
				params = {
						Bucket: config.Source,
						NotificationConfiguration: {
							LambdaFunctionConfigurations: [{
									Events: ['s3:ObjectCreated:*'],
									LambdaFunctionArn: config.IngestArn,
									Filter: {
										Key: {
											FilterRules: [{
												Name: 'suffix',
												Value: 'json'
											}]
										}
									}
								}
							]
						}
					};
					console.log('configuring S3 event for Metadata')
					await s3.putBucketNotificationConfiguration(params).promise();
				break;

			case 'Api':
				console.log('No S3 event configuration required for Api')
				break;

			default:
				throw new Error('WorkflowTrigger not defined in ',config);
		}
	}
	catch (err) {
		throw err;
	}
	return 'success';
};

module.exports = {
	putNotification: PutNotification
};
