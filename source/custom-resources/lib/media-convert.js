/*********************************************************************************************************************
 *  Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance        *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://aws.amazon.com/asl/                                                                                    *
 *                                                                                                                    *
 *  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

/**
 * @author Solution Builders
 **/
'use strict';
const fs = require('fs');
const AWS = require('aws-sdk');

const presets = [
	'./assets/mc-presets/mp4_Hevc_1080p_25fps_8500kbps.json',
	'./assets/mc-presets/mp4_Hevc_720p_25fps_6500kbps.json',
	'./assets/mc-presets/dash_Avc_16x9_1080p_29_97fps_8500kbps.json',
	'./assets/mc-presets/dash_Avc_16x9_720p_29_97fps_5000kbps.json',
	'./assets/mc-presets/dash_Avc_16x9_540p_29_97fps_3500kbps.json',
	'./assets/mc-presets/dash_Avc_16x9_360p_29_97fps_1200kbps.json',
	'./assets/mc-presets/dash_Avc_16x9_270p_14_99fps_400kbps.json',
	'./assets/mc-presets/dash_AAC_128kps_48_audio.json'
];

let response;

// Return MediaConvert Regional/Account Endpoint
let endPointPromise = function(event) {
	const mediaconvert = new AWS.MediaConvert();
	response = new Promise((res, reject) => {
		mediaconvert.describeEndpoints(function(err, data) {
			if (err) reject(err);
			else {
				let responseData = {
					EndpointUrl: data.Endpoints[0].Url
				};
				res(responseData);
			}
		});
	});
	return response;
};

// Create Custom MediaConvert presets
let createPreset = function(preset, workflow, url) {
	const mediaconvert = new AWS.MediaConvert({
		endpoint: url,
		region: process.env.AWS_REGION
	});
	return new Promise(function(res, reject) {
		let params = JSON.parse(fs.readFileSync(preset, 'utf8'));
		params.Name = workflow + params.Name;
		mediaconvert.createPreset(params, function(err, data) {
			if (err) reject(err);
			else {
				console.log('created preset: ',data.Preset.Name);
				res('sucess');
			}
		});
	});
};

let createPromise = function(event) {
	response = new Promise((res, reject) => {
		let promises = [];
		let name = event.ResourceProperties.Workflow;
		let url = event.ResourceProperties.EndPoint;

		presets.forEach(function(preset) {
			promises.push(createPreset(preset, name, url));
		});
		Promise.all(promises)
			.then(() => {
				res('sucess');
			})
			.catch(err => {
				console.log(err);
				reject(err);
			});
	});
	return response;
};


module.exports = {
	createPreset: createPromise,
	endpointUrl: endPointPromise
};
