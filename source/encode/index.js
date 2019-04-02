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

const AWS = require('aws-sdk');
const error = require('./lib/error.js');

exports.handler = async (event) => {
  console.log('REQUEST:: ', JSON.stringify(event, null, 2));

  const mediaconvert = new AWS.MediaConvert({
    endpoint: process.env.EndPoint
  });

  try {
    // define paths:
    let inputPath = 's3://' + event.srcBucket + '/' + event.srcVideo;
    let outputPath = 's3://' + event.destBucket + '/' + event.guid;

    // Baseline for the job parameters
    let job = {
      "JobTemplate": event.jobTemplate,
      "Role": process.env.MediaConvertRole,
      "UserMetadata": {
        "guid": event.guid,
        "workflow": event.workflowName,
        "Qvbr": process.env.Qvbr
      },
      "Settings": {
        "Inputs": [{
          "AudioSelectors": {
            "Audio Selector 1": {
              "Offset": 0,
              "DefaultSelection": "NOT_DEFAULT",
              "ProgramSelection": 1,
              "SelectorType": "TRACK",
              "Tracks": [
                1
              ]
            }
          },
          "VideoSelector": {
            "ColorSpace": "FOLLOW"
          },
          "FilterEnable": "AUTO",
          "PsiControl": "USE_PSI",
          "FilterStrength": 0,
          "DeblockFilter": "DISABLED",
          "DenoiseFilter": "DISABLED",
          "TimecodeSource": "EMBEDDED",
          "FileInput": inputPath,
        }],
        "OutputGroups": []
      }
    };

    let mp4 = {
      "Name": "File Group",
      "OutputGroupSettings": {
        "Type": "FILE_GROUP_SETTINGS",
        "FileGroupSettings": {
          "Destination": outputPath + '/mp4/',
        }
      },
      "Outputs": []
    };

    let hls = {
      "Name": "HLS Group",
      "OutputGroupSettings": {
        "Type": "HLS_GROUP_SETTINGS",
        "HlsGroupSettings": {
          "SegmentLength": 5,
          "MinSegmentLength": 0,
          "Destination": outputPath + '/hls/',
        }
      },
      "Outputs": []
    };

    let dash = {
      "Name": "DASH ISO",
      "OutputGroupSettings": {
        "Type": "DASH_ISO_GROUP_SETTINGS",
        "DashIsoGroupSettings": {
          "SegmentLength": 30,
          "FragmentLength": 3,
          "Destination": outputPath + '/dash/',
        }
      },
      "Outputs": []
    };

    let cmaf = {
      "Name": "CMAF",
      "OutputGroupSettings": {
        "Type": "CMAF_GROUP_SETTINGS",
        "CmafGroupSettings": {
          "SegmentLength": 30,
          "FragmentLength": 3,
          "Destination": outputPath + '/cmaf/',
        }
      },
      "Outputs": []
    };

    let mss = {
      "Name": "MS Smooth",
      "OutputGroupSettings": {
        "Type": "MS_SMOOTH_GROUP_SETTINGS",
        "MsSmoothGroupSettings": {
          "FragmentLength": 2,
          "ManifestEncoding": "UTF8",
          "Destination": outputPath + '/mss/',
        }
      },
      "Outputs": []
    };

    let frameCapture = {
      "CustomName": "Frame Capture",
      "Name": "File Group",
      "OutputGroupSettings": {
        "Type": "FILE_GROUP_SETTINGS",
        "FileGroupSettings": {
          "Destination": outputPath + "/thumbnails/"
        }
      },
      "Outputs": [{
        "NameModifier": "_tumb",
        "ContainerSettings": {
          "Container": "RAW"
        },
        "VideoDescription": {
          "ColorMetadata": "INSERT",
          "AfdSignaling": "NONE",
          "Sharpness": 100,
          "Height": event.frameHeight,
          "RespondToAfd": "NONE",
          "TimecodeInsertion": "DISABLED",
          "Width": event.frameWidth,
          "ScalingBehavior": "DEFAULT",
          "AntiAlias": "ENABLED",
          "CodecSettings": {
            "FrameCaptureSettings": {
              "MaxCaptures": 10000000,
              "Quality": 80,
              "FramerateDenominator": 5,
              "FramerateNumerator": 1
            },
            "Codec": "FRAME_CAPTURE"
          },
          "DropFrameTimecode": "ENABLED"
        }
      }]
    };

    let params = {
      Name: event.jobTemplate
    };
    let tmpl = await mediaconvert.getJobTemplate(params).promise();

    // OutputGroupSettings:Type is required and must be one of the following
    // HLS_GROUP_SETTINGS | DASH_ISO_GROUP_SETTINGS | FILE_GROUP_SETTINGS | MS_SMOOTH_GROUP_SETTINGS | CMAF_GROUP_SETTINGS,
    // Using this to determing the output types in the the job Template

    tmpl.JobTemplate.Settings.OutputGroups.forEach(function(output) {

      if (output.OutputGroupSettings.Type === 'FILE_GROUP_SETTINGS') {
        console.log(output.Name, ' found in Job Template');
        job.Settings.OutputGroups.push(mp4);
      }

      if (output.OutputGroupSettings.Type === 'HLS_GROUP_SETTINGS') {
        console.log(output.Name, ' found in Job Template');
        job.Settings.OutputGroups.push(hls);
      }

      if (output.OutputGroupSettings.Type === 'DASH_ISO_GROUP_SETTINGS') {
        console.log(output.Name, ' found in Job Template');
        job.Settings.OutputGroups.push(dash);
      }

      if (output.OutputGroupSettings.Type === 'MS_SMOOTH_GROUP_SETTINGS') {
        console.log(output.Name, ' found in Job Template');
        job.Settings.OutputGroups.push(mss);
      }

      if (output.OutputGroupSettings.Type === 'CMAF_GROUP_SETTINGS') {
        console.log(output.Name, ' found in Job Template');
        job.Settings.OutputGroups.push(cmaf);
      }

    });

    if (event.frameCapture) {
      job.Settings.OutputGroups.push(frameCapture);
    }

    let data = await mediaconvert.createJob(job).promise();
    event.encodingJob = job;
    event.ecodeJobId = data.Job.Id;
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.log(err);
    await error.handler(event, err);
    throw err;
  }
  return event;
};
