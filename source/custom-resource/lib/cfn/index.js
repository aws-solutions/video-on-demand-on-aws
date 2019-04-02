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

let  sendResponse = async (event, context, responseStatus, responseData, physicalResourceId) => {
  let data;
  try {
    let responseBody = JSON.stringify({
      Status: responseStatus,
      Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
      PhysicalResourceId: physicalResourceId || context.logStreamName,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: responseData
    });
    let params = {
      url: event.ResponseURL,
      port: 443,
      method: "put",
      headers: {
        "content-type": "",
        "content-length": responseBody.length
      },
      data: responseBody
    };
    data = await axios(params);
  }
  catch (err) {
    throw err;
  }
  return data.status;
};


module.exports = {
	send: sendResponse
};
