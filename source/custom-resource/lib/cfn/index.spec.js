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
const axios = require('axios');
const expect = require('chai').expect;
const MockAdapter = require('axios-mock-adapter');

let lambda = require('./index.js');

  let _event = {
    RequestType: "Create",
    ServiceToken: "arn:aws:lambda",
    ResponseURL: "https://cloudformation",
    StackId: "arn:aws:cloudformation",
    RequestId: "63e8ffa2-3059-4607-a450-119d473c73bc",
    LogicalResourceId: "Uuid",
    ResourceType: "Custom::UUID",
    ResourceProperties: {
        ServiceToken: "arn:aws:lambda",
        Resource: "abc"
    }
  }
  let _context = {
    logStreamName: 'cloudwatch'
  }
  let _responseStatus = 'ok'
  let _responseData = {
    test: 'testing'
  }

  describe('#CFN RESONSE::',() => {

    it('should return "200" on a send cfn response sucess', async () => {

  		let mock = new MockAdapter(axios);
  		mock.onPut().reply(200, {});

  		lambda.send(_event,_context, _responseStatus, _responseData, (err, res) => {
  				expect(res.status).to.equal(200);
  		});
  	});

    it('should return "Network Error" on connection timedout', async () => {

      let mock = new MockAdapter(axios);
      mock.onPut().networkError();

      await lambda.send(_event,_context, _responseStatus, _responseData).catch(err => {
        expect(err.toString()).to.equal("Error: Network Error");
      });
    });

});
