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

const AWS = require('aws-sdk');
const error = require('./lib/error.js');
const _ = require('lodash');

const getMp4Group = (outputPath) => ({
    Name: 'File Group',
    OutputGroupSettings: {
        Type: 'FILE_GROUP_SETTINGS',
        FileGroupSettings: {
            Destination: `${outputPath}/mp4/`
        }
    },
    Outputs: []
});

const getHlsGroup = (outputPath) => ({
    Name: 'HLS Group',
    OutputGroupSettings: {
        Type: 'HLS_GROUP_SETTINGS',
        HlsGroupSettings: {
            SegmentLength: 5,
            MinSegmentLength: 0,
            Destination: `${outputPath}/hls/`
        }
    },
    Outputs: []
});

const getDashGroup = (outputPath) => ({
    Name: 'DASH ISO',
    OutputGroupSettings: {
        Type: 'DASH_ISO_GROUP_SETTINGS',
        DashIsoGroupSettings: {
            SegmentLength: 30,
            FragmentLength: 3,
            Destination: `${outputPath}/dash/`
        }
    },
    Outputs: []
});

const getCmafGroup = (outputPath) => ({
    Name: 'CMAF',
    OutputGroupSettings: {
        Type: 'CMAF_GROUP_SETTINGS',
        CmafGroupSettings: {
            SegmentLength: 30,
            FragmentLength: 3,
            Destination: `${outputPath}/cmaf/`
        }
    },
    Outputs: []
});

const getMssGroup = (outputPath) => ({
    Name: 'MS Smooth',
    OutputGroupSettings: {
        Type: 'MS_SMOOTH_GROUP_SETTINGS',
        MsSmoothGroupSettings: {
            FragmentLength: 2,
            ManifestEncoding: 'UTF8',
            Destination: `${outputPath}/mss/`
        }
    },
    Outputs: []
});

const getFrameGroup = (event, outputPath) => ({
    CustomName: 'Frame Capture',
    Name: 'File Group',
    OutputGroupSettings: {
        Type: 'FILE_GROUP_SETTINGS',
        FileGroupSettings: {
            Destination: `${outputPath}/thumbnails/`
        }
    },
    Outputs: [{
        NameModifier: '_thumb',
        ContainerSettings: {
            Container: 'RAW'
        },
        VideoDescription: {
            ColorMetadata: 'INSERT',
            AfdSignaling: 'NONE',
            Sharpness: 100,
            Height: event.frameHeight,
            RespondToAfd: 'NONE',
            TimecodeInsertion: 'DISABLED',
            Width: event.frameWidth,
            ScalingBehavior: 'DEFAULT',
            AntiAlias: 'ENABLED',
            CodecSettings: {
                FrameCaptureSettings: {
                    MaxCaptures: 10000000,
                    Quality: 80,
                    FramerateDenominator: 5,
                    FramerateNumerator: 1
                },
                Codec: 'FRAME_CAPTURE'
            },
            DropFrameTimecode: 'ENABLED'
        }
    }]
});
//PR: https://github.com/awslabs/video-on-demand-on-aws/pull/107
const mergeSettingsWithDefault = (originalGroup, customGroup) => {
    return _.merge({}, originalGroup, customGroup);
};

exports.handler = async (event) => {
    console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`);

    const mediaconvert = new AWS.MediaConvert({
        endpoint: process.env.EndPoint
    });

    try {
        const inputPath = `s3://${event.srcBucket}/${event.srcVideo}`;
        const outputPath = `s3://${event.destBucket}/${event.guid}`;

        // Baseline for the job parameters
        let job = {
            JobTemplate: event.jobTemplate,
            Role: process.env.MediaConvertRole,
            UserMetadata: {
                guid: event.guid,
                workflow: event.workflowName
            },
            Settings: {
                Inputs: [{
                    AudioSelectors: {
                        'Audio Selector 1': {
                            Offset: 0,
                            DefaultSelection: 'NOT_DEFAULT',
                            ProgramSelection: 1,
                            SelectorType: 'TRACK',
                            Tracks: [
                                1
                            ]
                        }
                    },
                    VideoSelector: {
                        ColorSpace: 'FOLLOW',
                        Rotate: event.inputRotate
                    },
                    FilterEnable: 'AUTO',
                    PsiControl: 'USE_PSI',
                    FilterStrength: 0,
                    DeblockFilter: 'DISABLED',
                    DenoiseFilter: 'DISABLED',
                    TimecodeSource: 'EMBEDDED',
                    FileInput: inputPath,
                }],
                OutputGroups: []
            }
        };

        const mp4 = getMp4Group(outputPath);
        const hls = getHlsGroup(outputPath);
        const dash = getDashGroup(outputPath);
        const cmaf = getCmafGroup(outputPath);
        const mss = getMssGroup(outputPath);
        const frameCapture = getFrameGroup(event, outputPath);

        let tmpl = await mediaconvert.getJobTemplate({ Name: event.jobTemplate }).promise();
        console.log(`TEMPLATE:: ${JSON.stringify(tmpl, null, 2)}`);

        // OutputGroupSettings:Type is required and must be one of the following
        // HLS_GROUP_SETTINGS | DASH_ISO_GROUP_SETTINGS | FILE_GROUP_SETTINGS | MS_SMOOTH_GROUP_SETTINGS | CMAF_GROUP_SETTINGS,
        // Using this to determine the output types in the the job Template
        tmpl.JobTemplate.Settings.OutputGroups.forEach(group => {
            let found = false, defaultGroup = {};

            if (group.OutputGroupSettings.Type === 'FILE_GROUP_SETTINGS') {
                found = true;
                defaultGroup = mp4;
            }

            if (group.OutputGroupSettings.Type === 'HLS_GROUP_SETTINGS') {
                found = true;
                defaultGroup = hls;
            }

            if (group.OutputGroupSettings.Type === 'DASH_ISO_GROUP_SETTINGS') {
                found = true;
                defaultGroup = dash;
            }

            if (group.OutputGroupSettings.Type === 'MS_SMOOTH_GROUP_SETTINGS') {
                found = true;
                defaultGroup = mss;
            }

            if (group.OutputGroupSettings.Type === 'CMAF_GROUP_SETTINGS') {
                found = true;
                defaultGroup = cmaf;
            }

            if (found) {
                console.log(`${group.Name} found in Job Template`);
                // PR: https://github.com/awslabs/video-on-demand-on-aws/pull/107
                const outputGroup = mergeSettingsWithDefault(event.isCustomTemplate, defaultGroup, group);
                job.Settings.OutputGroups.push(outputGroup);
            }
        });

        if (event.frameCapture) {
            job.Settings.OutputGroups.push(frameCapture);
        }

        //if enabled the TimeCodeConfig needs to be set to ZEROBASED not passthrough
        //https://docs.aws.amazon.com/mediaconvert/latest/ug/job-requirements.html
        if (event.acceleratedTranscoding === 'PREFERRED' || event.acceleratedTranscoding === 'ENABLED') {
            job.AccelerationSettings = {"Mode" : event.acceleratedTranscoding}
            job.Settings.TimecodeConfig = {"Source" : "ZEROBASED"}
            job.Settings.Inputs[0].TimecodeSource = "ZEROBASED"
        }

        let data = await mediaconvert.createJob(job).promise();
        event.encodingJob = job;
        event.encodeJobId = data.Job.Id;

        console.log(`JOB:: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
        await error.handler(event, err);
        throw err;
    }

    return event;
};
