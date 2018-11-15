/**
 * @author Solution Builders
 * @function CFN Response
 * @description cloudformation response module for Node 8.10+
*/

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
