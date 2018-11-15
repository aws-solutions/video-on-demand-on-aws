/**
 * @function errHandler
 * @description passes the event object and error message to a Error Handler
 * lambda function.
 */
const AWS = require('aws-sdk');

let errHandler = async (event, _err) => {
	const lambda = new AWS.Lambda({
		region: process.env.AWS_REGION
	});
	try {
		let payload = {
			"guid": event.guid,
			"event": event,
			"function": process.env.AWS_LAMBDA_FUNCTION_NAME,
			"error": _err.toString()
		};
		let params = {
			FunctionName: process.env.ErrorHandler,
			Payload: JSON.stringify(payload, null, 2)
		};
		await lambda.invoke(params).promise();
	} catch (err) {
		console.log(err)
		throw err;
	}
	return 'success';
};


module.exports = {
	handler: errHandler
};
