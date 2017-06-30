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
const async = require('async');
const AWS = require('aws-sdk');
const fs = require('fs');
const response = require('cfn-response');
const elastictranscoder = new AWS.ElasticTranscoder({region: process.env.AWS_REGION});
const lambda = new AWS.Lambda({region: process.env.AWS_REGION});

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  let asyncFunctions = {};

  if (event.RequestType == "Delete") {
    // get ids from enviroment variable and delete presets:

    let preset_ids = process.env.preset_ids.split(',');

    async.forEach(preset_ids, function (id, callback){
        var params = {
          Id: id
        };
        elastictranscoder.deletePreset(params, function(err, data) {
            console.log('preset id: ' + id + ' deleted');
            response.send(event, context, response.SUCCESS);
        });
    }, function(err) {
        console.log(err, err.stack);
        response.send(event, context, response.FAILED, err);
    });
  }

  if (event.RequestType == "Create") {

    let presets = [{
            id: 'Hls_1080p',
            data: './presets/hls_1080p_7800.json'
        },
        {
            id: 'Hls_720p',
            data: './presets/hls_720p_6000.json'
        },
        {
            id: 'Hls_540p',
            data: './presets/hls_540p_2000.json'
        },
        {
            id: 'Hls_432p',
            data: './presets/hls_432p_1100.json'
        },
        {
            id: 'Hls_360p',
            data: './presets/hls_360p_730.json'
        },
        {
            id: 'Hls_270p',
            data: './presets/hls_270p_365.json'
        },
        {
            id: 'Hls_234p',
            data: './presets/hls_234p_145.json'
        },
        {
            id: 'Mp4_1080p',
            data: './presets/mp4_1080p_7800.json'
        },
        {
            id: 'Mp4_720p',
            data: './presets/mp4_720p_6000.json'
        },
        {
            id: 'Mp4_540p',
            data: './presets/mp4_540p_2000.json'
        },
        {
            id: 'Mp4_432p',
            data: './presets/mp4_432p_1100.json'
        },
        {
            id: 'Mp4_360p',
            data: './presets/mp4_360p_730.json'
        },
        {
            id: 'Mp4_270p',
            data: './presets/mp4_270p_365.json'
        },
        {
            id: 'Mp4_234p',
            data: './presets/mp4_234p_145.json'
        }
    ];

    presets.forEach(function(preset, index) {

        asyncFunctions[preset.id] = function(callback) {

            let params = JSON.parse(fs.readFileSync(preset.data, 'utf8'));

            elastictranscoder.createPreset(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    callback(err);
                } else {
                    callback(null, data.Preset.Id);
                }
            });
        };
    });

    async.parallel(asyncFunctions,

        function(err, results) {
            if (err) {
                console.log(err, err.stack);
                response.send(event, context, response.FAILED, err);
            } else {
              let ids = [results.Mp4_1080p,results.Mp4_720p,results.Mp4_540p,results.Mp4_432p,results.Mp4_360p,results.Mp4_270p,results.Mp4_234p,results.Hls_1080p,results.Hls_720p,results.Hls_540p,results.Hls_432p,results.Hls_360p,results.Hls_270p,results.Hls_234p];

              let params = {
               FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
               Environment: {
                  Variables: {
                    preset_ids: ids.toString()
                  }
                }
              };

              lambda.updateFunctionConfiguration(params, function(err, data) {
                if (err) {
                  console.log(err, err.stack);
                  response.send(event, context, response.FAILED, err);
                }
                else {
                  console.log(results.toString());
                  response.send(event, context, response.SUCCESS, results);
                }
              });
            }
        }
    );
  }
};
