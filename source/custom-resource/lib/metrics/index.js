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
// FEATURE/P15424610
// Metrics helper updated to use AXIOS which has support for promises and Async/Await.

const axios = require('axios');
const moment = require('moment');


let  sendMetrics = async (config) => {
  let data;
  try {
		let metrics = {
			Solution: config.SolutionId,
			UUID: config.UUID,
			TimeStamp: moment().utc().format('YYYY-MM-DD HH:mm:ss.S'),
			Data: config
		};
		let params = {
      method: 'post',
      port: 443,
			url: 'https://metrics.awssolutionsbuilder.com/generic',
      headers: {
        'Content-Type': 'application/json'
      },
      data: metrics
    };
    //Send Metrics & retun status code.
    data = await axios(params);
  }
	catch (err) {
    throw err;
  }
  return data.status;
};


module.exports = {
	send: sendMetrics
};
