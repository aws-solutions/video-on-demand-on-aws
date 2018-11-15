let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('../index.js');

describe('#SOURCE ARCHIVE::', () => {

  let _event = {
    guid: "1234",
    srcVideo: "example.mpg",
    srcBucket: "bucket"
  };

	process.env.ErrorHandler = 'error_handler';
  process.env.AWS_LAMBDA_FUNCTION_NAME = 'Lambda';

  afterEach(() => {
    AWS.restore('S3');
  });

  it('should return "SUCCESS" when s3 tag object returns success', async () => {
    AWS.mock('S3', 'putObjectTagging', Promise.resolve());

    let response = await lambda.handler(_event)
		expect(response.guid).to.equal('1234');
  });

  it('should return "TAG ERROR" when s3 tag object fails', async () => {
    AWS.mock('S3', 'putObjectTagging', Promise.reject('TAG ERROR'));
    AWS.mock('Lambda','invoke', Promise.resolve());

    await lambda.handler(_event).catch(err => {
      expect(err).to.equal('TAG ERROR');
    });
  });

});
