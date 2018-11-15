const axios = require('axios');
const expect = require('chai').expect;
const MockAdapter = require('axios-mock-adapter');

let lambda = require('./index.js');

let _config = {
		SolutionId: 'SO0021',
		UUID: '999-999'
	}

describe('#SEND METRICS', () => {

	it('should return "200" on a send metrics sucess', async () => {

		let mock = new MockAdapter(axios);
		mock.onPost().reply(200, {});

		lambda.send(_config, (err, res) => {
				expect(res).to.equal(200);
		});
	});

	it('should return "Network Error" on connection timedout', async () => {

		let mock = new MockAdapter(axios);
		mock.onPut().networkError();

		await lambda.send(_config).catch(err => {
			expect(err.toString()).to.equal("Error: Request failed with status code 404");
		});
	});

});
