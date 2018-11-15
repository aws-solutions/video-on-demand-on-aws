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
