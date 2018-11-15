//AWS_REGION='us-east-1' mocha ingest/ingest-sns.spec.js
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./index.js');

let data = {
	JobTemplate:{
		Name:'name'
	},
	Endpoints: [{
		Url: 'https://test.com'
	}]
};

let _config = {
		StackName: 'test',
		EndPoint: 'https://test.com'
	}

describe('#MEDIACONVERT::', () => {

	afterEach(() => {
		AWS.restore('MediaConvert');
	});

	it('should return "SUCCESS" on mediaconvert describeEndpoints', async () => {

		AWS.mock('MediaConvert', 'describeEndpoints', Promise.resolve(data));

		let response = await lambda.getEndpoint(_config)
		expect(response.EndpointUrl).to.equal('https://test.com');
	});

	it('should return "SUCCESS" on mediaconvert create templates', async () => {

		AWS.mock('MediaConvert', 'createJobTemplate', Promise.resolve(data));

		let response = await lambda.createTemplates(_config)
		expect(response).to.equal('success');
	});

	it('should return "ERROR" on mediaconvert describeEndpoints', async () => {
		AWS.mock('MediaConvert', 'describeEndpoints', Promise.reject('ERROR'));

		await lambda.getEndpoint(_config).catch(err => {
			expect(err).to.equal('ERROR');
		});
	});

	it('should return "ERROR" on mediaconvert create templates', async () => {
		AWS.mock('MediaConvert', 'createJobTemplate', Promise.reject('ERROR'));

		await lambda.createTemplates(_config).catch(err => {
			expect(err).to.equal('ERROR');
		});
	});

});
