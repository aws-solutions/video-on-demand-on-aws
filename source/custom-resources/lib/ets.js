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
const PromiseThrottle = require('promise-throttle');
const AWS = require('aws-sdk');
const throttle = new PromiseThrottle({
  requestsPerSecond:0.5,
  promiseImplementation: Promise
});

let params;
let response;
let responseData;

let createPipelinePromise = function(event) {
  const elastictranscoder = new AWS.ElasticTranscoder({
    region: process.env.AWS_REGION
  });
  response = new Promise((res, reject) => {

    params = {
      InputBucket: event.ResourceProperties.Source,
      Name: event.ResourceProperties.Name,
      Role: event.ResourceProperties.Role,
      Notifications: {
        Completed: event.ResourceProperties.Complete,
        Error: event.ResourceProperties.Error,
        Progressing: event.ResourceProperties.Progress,
        Warning: event.ResourceProperties.Warning
      },
      OutputBucket: event.ResourceProperties.Dest,
    };

    elastictranscoder.createPipeline(params, function(err, data) {
      if (err) reject(err);
      else {
        responseData = {
          PipelineId: data.Pipeline.Id
        };
        res(responseData);
      }
    });
  });
  return response;
};

let deletePipelinePromise = function(event) {
  const elastictranscoder = new AWS.ElasticTranscoder({
    region: process.env.AWS_REGION
  });
  response = new Promise((res, reject) => {

    params = {
      Id: event.PhysicalResourceId
    };

    elastictranscoder.deletePipeline(params, function(err, data) {
      if (err) reject(err);
      else {
        res(data);
      }
    });
  });
  return response;
};

let createPresetPromise = function(params) {
  const elastictranscoder = new AWS.ElasticTranscoder({
    region: process.env.AWS_REGION
  });
  const lambda = new AWS.Lambda({
    region: process.env.AWS_REGION
  });

  response = new Promise((res, reject) => {
    let presets = [{
        id: 'Hls_1080p',
        data: './assets/ets-presets/hls_1080p_7800.json'
      },
      {
        id: 'Hls_720p',
        data: './assets/ets-presets/hls_720p_6000.json'
      },
      {
        id: 'Hls_540p',
        data: './assets/ets-presets/hls_540p_2000.json'
      },
      {
        id: 'Hls_360p',
        data: './assets/ets-presets/hls_360p_730.json'
      },
      {
        id: 'Hls_270p',
        data: './assets/ets-presets/hls_270p_365.json'
      },
      {
        id: 'Mp4_1080p',
        data: './assets/ets-presets/mp4_1080p_7800.json'
      },
      {
        id: 'Mp4_720p',
        data: './assets/ets-presets/mp4_720p_6000.json'
      },
      {
        id: 'Dash_1080p',
        data: './assets/ets-presets/dash_1080p_7800.json'
      },
      {
        id: 'Dash_720p',
        data: './assets/ets-presets/dash_720p_6000.json'
      },
      {
        id: 'Dash_540p',
        data: './assets/ets-presets/dash_540p_2000.json'
      },
      {
        id: 'Dash_360p',
        data: './assets/ets-presets/dash_360p_730.json'
      },
      {
        id: 'Dash_270p',
        data: './assets/ets-presets/dash_270p_365.json'
      }
    ];

    let creates = [];
    let Ids = {};

    let CreatePreset = function(i) {
      return new Promise(function(res, reject) {
        let params = JSON.parse(fs.readFileSync(i.data, 'utf8'));
        elastictranscoder.createPreset(params, function(err, data) {
          if (err) reject(err);
          else {
            let id = i.id;
            Ids[id] = data.Preset.Id;
            console.log('created preset: ',data.Preset.Id);
            res(data.Preset.Id);
          }
        });
      });
    };

    for (let i = presets.length - 1; i >= 0; i--) {
      let p = throttle.add(CreatePreset.bind(this, presets[i]));
      creates.push(p);
    }

    Promise.all(creates)
      .then(results => {

        let params = {
          FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
          Environment: {
            Variables: {
              presetIds: results.toString()
            }
          }
        };

        lambda.updateFunctionConfiguration(params, function(err, data) {
          if (err) throw(err);
          else {
            res(Ids);
          }
        });
      })
      .catch(err => {
        console.log(err);
        reject(err);
      })
  });
  return response;
};

let deletePresetPromise = function(params) {
  const elastictranscoder = new AWS.ElasticTranscoder({
    region: process.env.AWS_REGION
  });

  response = new Promise((res, reject) => {
    let presetIds = process.env.presetIds.split(',');
    let delPreset = function(i) {
      return new Promise(function(res, reject) {
        let params = {
          Id: i
        };
        elastictranscoder.deletePreset(params, function(err, data) {
          if (err) reject(err);
          else res(i);
        });
      });
    };

    let deletes = [];

    for (let i = presetIds.length - 1; i >= 0; i--) {
      let p = throttle.add(delPreset.bind(this, presetIds[i]));
      deletes.push(p);
    }

    Promise.all(deletes)
      .then(results => {
        res('presets deleted: '+results);
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
  });
  return response;
};

module.exports = {
  createPipeline: createPipelinePromise,
  deletePipeline: deletePipelinePromise,
  createPreset: createPresetPromise,
  deletePreset: deletePresetPromise,
};
