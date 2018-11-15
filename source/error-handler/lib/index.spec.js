let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('../index.js');

describe('#ERROR HANDLER::', () => {
  let _lambda = {
    guid: "1234",
    error: "FROM LAMBDA",
    function:"workflow",
  };

  let _encode = {
    guid: "12345678",
    error: "FROM MEDIACONVERT",
    detial:{
      userMetadata:{
        guid:'abcdefg'
      }
    }
  };

  afterEach(() => {
    AWS.restore('DynamoDB.DocumentClient');
    AWS.restore('SNS');
  });

  it('should return "FROM LAMBDA" processing a lambda error', async () => {

    AWS.mock('DynamoDB.DocumentClient', 'update', Promise.resolve());
    AWS.mock('SNS', 'publish', Promise.resolve());

    let response = await lambda.handler(_lambda)
		expect(response.error).to.equal('FROM LAMBDA');
	});

  it('should return "FROM MEDIACONVERT" processing a mediaconvert error', async () => {

    AWS.mock('DynamoDB.DocumentClient', 'update', Promise.resolve());
    AWS.mock('SNS', 'publish', Promise.resolve());

    let response = await lambda.handler(_encode)
    expect(response.error).to.equal('FROM MEDIACONVERT');
  });

  it('should return "DB_ERROR" processing a lambda error', async () => {

    AWS.mock('DynamoDB.DocumentClient', 'update', Promise.reject('DB_ERROR'));
    AWS.mock('SNS', 'publish', Promise.resolve());

    await lambda.handler(_lambda).catch(err => {
      expect(err).to.equal('DB_ERROR');
    })
  });

  it('should return "SNS_ERROR" processing a lambda error', async () => {

    AWS.mock('DynamoDB.DocumentClient', 'update', Promise.resolve());
    AWS.mock('SNS', 'publish', Promise.reject('SNS_ERROR'));

    await lambda.handler(_encode).catch(err => {
      expect(err).to.equal('SNS_ERROR');
    })
  });

});
