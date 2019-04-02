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
const fs = require('fs');
const AWS = require('aws-sdk');

//Feature/so-vod-173 QVBR versions of the default system presets.
const qvbrPresets = [{
        name: '_Mp4_Avc_Aac_16x9_1280x720p_24Hz_4.5Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Mp4_Avc_Aac_16x9_1280x720p_24Hz_4.5Mbps_qvbr.json'
    },
    {
        name: '_Mp4_Avc_Aac_16x9_1920x1080p_24Hz_6Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Mp4_Avc_Aac_16x9_1920x1080p_24Hz_6Mbps_qvbr.json'
    },
    {
        name: '_Mp4_Hevc_Aac_16x9_3840x2160p_24Hz_20Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Mp4_Hevc_Aac_16x9_3840x2160p_24Hz_20Mbps_qvbr.json'
    },
    {
        name: '_Ott_Dash_Mp4_Avc_16x9_1280x720p_30Hz_6.5Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_1280x720p_30Hz_6.5Mbps_qvbr.json'
    },
    {
        name: '_Ott_Dash_Mp4_Avc_16x9_480x270p_15Hz_0.4Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_480x270p_15Hz_0.4Mbps_qvbr.json'
    },
    {
        name: '_Ott_Dash_Mp4_Avc_16x9_1920x1080p_30Hz_8.5Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_1920x1080p_30Hz_8.5Mbps_qvbr.json'
    },
    {
        name: '_Ott_Dash_Mp4_Avc_16x9_640x360p_30Hz_0.6Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_640x360p_30Hz_0.6Mbps_qvbr.json'
    },
    {
        name: '_Ott_Dash_Mp4_Avc_16x9_1280x720p_30Hz_3.5Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_1280x720p_30Hz_3.5Mbps_qvbr.json'
    },
    {
        name: '_Ott_Dash_Mp4_Avc_16x9_640x360p_30Hz_1.2Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_640x360p_30Hz_1.2Mbps_qvbr.json'
    },
    {
        name: '_Ott_Dash_Mp4_Avc_16x9_1280x720p_30Hz_5.0Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_1280x720p_30Hz_5.0Mbps_qvbr.json'
    },
    {
        name: '_Ott_Dash_Mp4_Avc_16x9_960x540p_30Hz_3.5Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_960x540p_30Hz_3.5Mbps_qvbr.json'
    },
    {
        name: '_Ott_Hls_Ts_Avc_Aac_16x9_1280x720p_30Hz_3.5Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_1280x720p_30Hz_3.5Mbps_qvbr.json'
    },
    {
        name: '_Ott_Hls_Ts_Avc_Aac_16x9_480x270p_15Hz_0.4Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_480x270p_15Hz_0.4Mbps_qvbr.json'
    },
    {
        name: '_Ott_Hls_Ts_Avc_Aac_16x9_1280x720p_30Hz_5.0Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_1280x720p_30Hz_5.0Mbps_qvbr.json'
    },
    {
        name: '_Ott_Hls_Ts_Avc_Aac_16x9_640x360p_30Hz_0.6Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_640x360p_30Hz_0.6Mbps_qvbr.json'
    },
    {
        name: '_Ott_Hls_Ts_Avc_Aac_16x9_1280x720p_30Hz_6.5Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_1280x720p_30Hz_6.5Mbps_qvbr.json'
    },
    {
        name: '_Ott_Hls_Ts_Avc_Aac_16x9_640x360p_30Hz_1.2Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_640x360p_30Hz_1.2Mbps_qvbr.json'
    },
    {
        name: '_Ott_Hls_Ts_Avc_Aac_16x9_1920x1080p_30Hz_8.5Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_1920x1080p_30Hz_8.5Mbps_qvbr.json'
    },
    {
        name: '_Ott_Hls_Ts_Avc_Aac_16x9_960x540p_30Hz_3.5Mbps_qvbr',
        file: './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_960x540p_30Hz_3.5Mbps_qvbr.json'
    }
];

const cbrPresets = [{
    name: '_Mp4_Hevc_Aac_16x9_3840x2160p_24Hz_20Mbps',
    file: './lib/mediaconvert/presets/_Mp4_Hevc_Aac_16x9_3840x2160p_24Hz_20Mbps.json'
}];

const qvbrTemplates = [{
        name: '_Ott_2160p_Avc_Aac_16x9_qvbr',
        file: './lib/mediaconvert/templates/2160p_avc_aac_16x9_qvbr.json'
    },
    {
        name: '_Ott_1080p_Avc_Aac_16x9_qvbr',
        file: './lib/mediaconvert/templates/1080p_avc_aac_16x9_qvbr.json'
    },
    {
        name: '_Ott_720p_Avc_Aac_16x9_qvbr',
        file: './lib/mediaconvert/templates/720p_avc_aac_16x9_qvbr.json'
    }
];

const cbrTemplates = [{
        name: '_Ott_2160p_Avc_Aac_16x9',
        file: './lib/mediaconvert/templates/2160p_avc_aac_16x9.json'
    },
    {
        name: '_Ott_1080p_Avc_Aac_16x9',
        file: './lib/mediaconvert/templates/1080p_avc_aac_16x9.json'
    },
    {
        name: '_Ott_720p_Avc_Aac_16x9',
        file: './lib/mediaconvert/templates/720p_avc_aac_16x9.json'
    }
];

// Get the Account regional MediaConvert endpoint for making API calls
let GetEndpoints = async (config) => {
    const mediaconvert = new AWS.MediaConvert();
    let responseData;
    try {
        let data = await mediaconvert.describeEndpoints().promise();
        responseData = {
            EndpointUrl: data.Endpoints[0].Url
        };
    } catch (err) {
        throw err;
    }
    return responseData;
};


let CreateTemplates = async (config) => {
    const mediaconvert = new AWS.MediaConvert({
        endpoint: config.EndPoint,
        region: process.env.AWS_REGION
    });

    let presets = [];
    let templates = [];

    try {

        if (config.Qvbr === 'true') {
            //use qvbr presets
            presets = qvbrPresets;
            templates = qvbrTemplates;
        } else {
            //use system presets + one new UHD mp4 preset
            presets = cbrPresets;
            templates = cbrTemplates;
        }

        await Promise.all(presets.map(async preset => {
            //add stackname to the presetname to insure it is unique
            let name = config.StackName + preset.name;
            let params = {
                Name: name,
                Category: 'VOD',
                Description: 'video on demand on aws',
                Settings: JSON.parse(fs.readFileSync(preset.file, 'utf8'))
            };
            await mediaconvert.createPreset(params).promise();
            console.log('preset created:: ', name);
        }));

        await Promise.all(templates.map(async tmpl => {
            //load template and set unique template name
            let params = JSON.parse(fs.readFileSync(tmpl.file, 'utf8'));
            params.Name = config.StackName + params.Name;
            //Update preset names unless system presets
            params.Settings.OutputGroups.forEach((group) => {
                group.Outputs.forEach((output) => {
                    if (!output.Preset.startsWith('System')) {
                        output.Preset = config.StackName + output.Preset;
                    }
                });
            });

            await mediaconvert.createJobTemplate(params).promise();
            console.log('template created:: ', params.Name);
        }));

    } catch (err) {
        throw err;
    }
    return 'success';
};

//Feature/so-vod-176 Support for stack update
let UpdateTemplates = async (config) => {
    const mediaconvert = new AWS.MediaConvert({
        endpoint: config.EndPoint,
        region: process.env.AWS_REGION
    });

    try {
      let qvbr = 'false';
      //Check if the curent templates are QVBR or not.
      let params = {
        Category: 'VOD'
      };
      let data = await mediaconvert.listJobTemplates(params).promise();
      data.JobTemplates.forEach((template) => {
        //Check for one of the qvbr templates.
        if (template.Name === config.StackName+'_Ott_720p_Avc_Aac_16x9_qvbr'){
          qvbr = 'true';
        }
      });
      if (config.Qvbr != qvbr) {
        // if equal the same templates were deployed on the stack create.
        console.log('creating MediaConvert Templates');
        await CreateTemplates(config);
      } else {
        console.log('No changes to the MediaConvert Templates')
      }
    } catch (err) {
        console.log(err);
        throw err;
    }
    return 'success';
};

//Feature/so-vod-173 limit on the numberof custom presets per region,
//deleting on a stack delte
let DeleteTemplates = async (config) => {
    const mediaconvert = new AWS.MediaConvert({
        endpoint: config.EndPoint,
        region: process.env.AWS_REGION
    });

    try {

        let presets = [];
        let templates = [];

        if (config.Qvbr === 'true') {
            //use qvbr presets
            presets = qvbrPresets;
            templates = qvbrTemplates;
        } else {
            //use system presets + one new UHD mp4 preset
            presets = cbrPresets;
            templates = cbrTemplates;
        }
        //Delete custom presets
        await Promise.all(presets.map(async preset => {
            let name = config.StackName + preset.name;
            let params = {
                Name: name
            };
            await mediaconvert.deletePreset(params).promise();
            console.log('preset deleted:: ', name);
        }));
        //Delete Custom TEmplates
        await Promise.all(templates.map(async tmpl => {
            let name = config.StackName + tmpl.name;
            let params = {
                Name: name
            };
            await mediaconvert.deleteJobTemplate(params).promise();
            console.log('template deleted:: ', name);
        }));

    } catch (err) {
        console.log(err);
        throw err;
    }
    return 'success';
};


module.exports = {
    getEndpoint: GetEndpoints,
    createTemplates: CreateTemplates,
    updateTemplates: UpdateTemplates,
    deleteTemplates: DeleteTemplates
};
