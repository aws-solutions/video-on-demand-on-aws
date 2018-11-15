/**
 * @author Solution Builders
 * @function Metrics Helper
 * @description Send Anonymous Metrics to Amazon Web Services
*/

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
