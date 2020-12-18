/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const fs = require('fs');
const AWS = require('aws-sdk');

const CATEGORY = 'VOD';
const DESCRIPTION = 'video on demand on aws';

const qvbrPresets = [
    {
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

// templates from v5.1.0 and older
const qvbrTemplates = [
    {
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

const mediaPackageTemplates = [
    {
        name: '_Ott_2160p_Avc_Aac_16x9_mvod',
        file: './lib/mediaconvert/templates/2160p_avc_aac_16x9_mvod.json'
    },
    {
        name: '_Ott_1080p_Avc_Aac_16x9_mvod',
        file: './lib/mediaconvert/templates/1080p_avc_aac_16x9_mvod.json'
    },
    {
        name: '_Ott_720p_Avc_Aac_16x9_mvod',
        file: './lib/mediaconvert/templates/720p_avc_aac_16x9_mvod.json'
    }
];

// updated templates for v5.2.0 that don't use presets
const qvbrTemplatesNoPreset = [
    {
        name: '_Ott_2160p_Avc_Aac_16x9_qvbr_no_preset',
        file: './lib/mediaconvert/templates/2160p_avc_aac_16x9_qvbr_no_preset.json'
    },
    {
        name: '_Ott_1080p_Avc_Aac_16x9_qvbr_no_preset',
        file: './lib/mediaconvert/templates/1080p_avc_aac_16x9_qvbr_no_preset.json'
    },
    {
        name: '_Ott_720p_Avc_Aac_16x9_qvbr_no_preset',
        file: './lib/mediaconvert/templates/720p_avc_aac_16x9_qvbr_no_preset.json'
    }
];

const mediaPackageTemplatesNoPreset = [
    {
        name: '_Ott_2160p_Avc_Aac_16x9_mvod_no_preset',
        file: './lib/mediaconvert/templates/2160p_avc_aac_16x9_mvod_no_preset.json'
    },
    {
        name: '_Ott_1080p_Avc_Aac_16x9_mvod_no_preset',
        file: './lib/mediaconvert/templates/1080p_avc_aac_16x9_mvod_no_preset.json'
    },
    {
        name: '_Ott_720p_Avc_Aac_16x9_mvod_no_preset',
        file: './lib/mediaconvert/templates/720p_avc_aac_16x9_mvod_no_preset.json'
    }
];

// Get the Account regional MediaConvert endpoint for making API calls
const GetEndpoints = async () => {
    const mediaconvert = new AWS.MediaConvert();
    const data = await mediaconvert.describeEndpoints().promise();

    return {
        EndpointUrl: data.Endpoints[0].Url
    };
};

const _createTemplates = async (instance, templates, stackName) => {
    for (let tmpl of templates) {
        // Load template and set unique template name
        let params = JSON.parse(fs.readFileSync(tmpl.file, 'utf8'));
        params.Name = stackName + params.Name;

        await instance.createJobTemplate(params).promise();
        console.log(`template created:: ${params.Name}`);
    }
};

const Create = async (config) => {
    const mediaconvert = new AWS.MediaConvert({
        endpoint: config.EndPoint,
        region: process.env.AWS_REGION
    });

    await _createTemplates(mediaconvert, mediaPackageTemplatesNoPreset, config.StackName);
    await _createTemplates(mediaconvert, qvbrTemplatesNoPreset, config.StackName);

    return 'success';
};

const Update = async (config) => {
    const mediaconvert = new AWS.MediaConvert({
        endpoint: config.EndPoint,
        region: process.env.AWS_REGION
    });

    let templatesNoPreset = 'false';
    let data = await mediaconvert.listJobTemplates({ Category: CATEGORY }).promise();

    // Check if the current templates are MediaPackage are from 5.2.0 (no presets) or not.
    data.JobTemplates.forEach(template => {
        if (template.Name.includes(config.StackName) && template.Name.includes("_no_preset")) {
            templatesNoPreset = 'true';
        }
    });
    // if there are no templates with '_no_preset', then this update is from an older version of solution
    // we need to create the new templates without deleting the old presets and templates
    if (templatesNoPreset == 'false') {
        console.log("Creating templates with no presets")
        await _createTemplates(mediaconvert, qvbrTemplatesNoPreset, config.StackName);
        await _createTemplates(mediaconvert, mediaPackageTemplatesNoPreset, config.StackName);
    }

    return 'success';
};

const _deletePresets = async (instance, presets, stackName) => {
    for (let preset of presets) {
        let name = stackName + preset.name;

        await instance.deletePreset({ Name: name }).promise();
        console.log(`preset deleted:: ${name}`);
    }
};

const _deleteTemplates = async (instance, templates, stackName) => {
    for (let tmpl of templates) {
        let name = stackName + tmpl.name;

        await instance.deleteJobTemplate({ Name: name }).promise();
        console.log(`template deleted:: ${name}`);
    }
};

const Delete = async (config) => {
    const mediaconvert = new AWS.MediaConvert({
        endpoint: config.EndPoint,
        region: process.env.AWS_REGION
    });

    try {
        let templates = [];

        await _deleteTemplates(mediaconvert, mediaPackageTemplatesNoPreset, config.StackName);
        await _deleteTemplates(mediaconvert, qvbrTemplatesNoPreset, config.StackName);

        // if this Delete is happening after an update to an older version
        // then we also need to delete templates and presets from the older deployment 
        await _deleteTemplates(mediaconvert, qvbrTemplates, config.StackName);
        await _deleteTemplates(mediaconvert, mediaPackageTemplates, config.StackName)
        await _deletePresets(mediaconvert, qvbrPresets, config.StackName);

    } catch (err) {
        console.log(err);
        throw err;
    }

    return 'success';
};

module.exports = {
    getEndpoint: GetEndpoints,
    createTemplates: Create,
    updateTemplates: Update,
    deleteTemplates: Delete
};
