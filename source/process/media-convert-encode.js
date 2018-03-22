'use strict';
const AWS = require('aws-sdk');
const error = require('./lib/error.js');

const presets = {
  //MP4 SYSTEM PRESETS
  m2160p:process.env.mp4_2160p,
  m1080p:process.env.mp4_1080p,
  m720p:process.env.mp4_720p,
  //DASH CUSTOM PRESETS
  d1080p:process.env.dash_1080p,
  d720p:process.env.dash_720p,
  d540p:process.env.dash_540p,
  d360p:process.env.dash_360p,
  d270p:process.env.dash_270p,
  audio:process.env.dash_audio,
  // HLS SYSTEM PRESETS
  h1080p:process.env.hls_1080p,
  h720p:process.env.hls_720p,
  h540p:process.env.hls_540p,
  h360p:process.env.hls_360p,
  h270p:process.env.hls_270p
};

exports.handler = (event, context, callback) => {
  //console.log('Received event:', JSON.stringify(event, null, 2));

  let params = {
    "Role": process.env.MediaConvertRole,
    "UserMetadata": {
      "guid": event.guid,
      "workflow": process.env.Workflow
    },
    "Settings": {
      "AdAvailOffset": 0,
      "Inputs": [{
        "FilterEnable": "AUTO",
        "PsiControl": "USE_PSI",
        "FilterStrength": 0,
        "DeblockFilter": "DISABLED",
        "DenoiseFilter": "DISABLED",
        "TimecodeSource": "EMBEDDED",
        "VideoSelector": {
          "ColorSpace": "FOLLOW"
        },
        "AudioSelectors": {
          "Audio Selector 1": {
            "Offset": 0,
            "DefaultSelection": "DEFAULT",
            "ProgramSelection": 1
          }
        },
        "FileInput": "s3://" + event.srcBucket + '/' + event.srcVideo,
      }],
      "OutputGroups": []
    }
  };

  let mp4Outputs = {
    "Name": "File Group",
    "OutputGroupSettings": {
      "Type": "FILE_GROUP_SETTINGS",
      "FileGroupSettings": {
        "Destination": "s3://" + event.mp4Bucket + "/" + event.guid + "/mp4/"
      }
    },
    "Outputs": []
  };

  let hlsOutputs = {
    "Name": "Apple HLS",
    "OutputGroupSettings": {
      "Type": "HLS_GROUP_SETTINGS",
      "HlsGroupSettings": {
        "ManifestDurationFormat": "INTEGER",
        "SegmentLength": 10,
        "TimedMetadataId3Period": 10,
        "CaptionLanguageSetting": "OMIT",
        "TimedMetadataId3Frame": "PRIV",
        "CodecSpecification": "RFC_4281",
        "OutputSelection": "MANIFESTS_AND_SEGMENTS",
        "ProgramDateTimePeriod": 600,
        "MinSegmentLength": 0,
        "DirectoryStructure": "SINGLE_DIRECTORY",
        "ProgramDateTime": "EXCLUDE",
        "SegmentControl": "SEGMENTED_FILES",
        "ManifestCompression": "NONE",
        "ClientCache": "ENABLED",
        "StreamInfResolution": "INCLUDE",
        "Destination": "s3://" + event.abrBucket + "/" + event.guid + "/hls/"
      }
    },
    "Outputs": []
  };

  let dashOutputs = {
    "Name": "DASH ISO",
    "OutputGroupSettings": {
      "Type": "DASH_ISO_GROUP_SETTINGS",
      "DashIsoGroupSettings": {
          "HbbtvCompliance": "NONE",
          "SegmentLength": 30,
          "FragmentLength": 2,
          "SegmentControl": "SEGMENTED_FILES",
          "Destination": "s3://" + event.abrBucket + "/" + event.guid + "/dash/"
      }
    },
    "Outputs": []
  };

  let mp4FrameCapture = {
    "CustomName": "MP4 Frame Capture",
    "Name": "File Group",
    "OutputGroupSettings": {
      "Type": "FILE_GROUP_SETTINGS",
      "FileGroupSettings": {
        "Destination": "s3://" + event.mp4Bucket + "/" + event.guid + "/thumbnails/"
      }
    },
    "Outputs":[
      {
          "NameModifier": "_mp4_tumb",
          "ContainerSettings": {
              "Container": "RAW"
          },
          "VideoDescription": {
              "ColorMetadata": "INSERT",
              "AfdSignaling": "NONE",
              "Sharpness": 100,
              "Height":  event.frameHeight,
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
      }
    ]
  };

  let abrFrameCapture = {
    "CustomName": "ABR Frame Capture",
    "Name": "File Group",
    "OutputGroupSettings": {
      "Type": "FILE_GROUP_SETTINGS",
      "FileGroupSettings": {
        "Destination": "s3://" + event.abrBucket + "/" + event.guid + "/thumbnails/"
      }
    },
    "Outputs":[
      {
          "NameModifier": "_abr_tumb",
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
      }
    ]
  };

  if (event.mp4 && event.mp4.length > 0) {
    for (let i = event.mp4.length - 1; i >= 0; i--) {
      switch (event.mp4[i]) {
        case 2160:
          {
            mp4Outputs.Outputs.push({
              "Preset": presets.m2160p,
              "NameModifier": "_2160p"
            });
            break;
          }
        case 1080:
          {
            mp4Outputs.Outputs.push({
              "Preset": presets.m1080p,
              "NameModifier": "_1080p"
            });
            break;
          }
        case 720:
          {
            mp4Outputs.Outputs.push({
              "Preset": presets.m720p,
              "NameModifier": "_720p"
            });
            break;
          }
        default:
          {
            console.log('No presets defined');
          }
      }
    }

    params.Settings.OutputGroups.push(mp4Outputs);
  }

  if (event.hls && event.hls.length > 0) {
    for (let i = event.hls.length - 1; i >= 0; i--) {
      switch (event.hls[i]) {
        case 1080:
          {
            hlsOutputs.Outputs.push({
              "Preset": presets.h1080p,
              "NameModifier": "_1080p"
            });
            break;
          }
        case 720:
          {
            hlsOutputs.Outputs.push({
              "Preset": presets.h720p,
              "NameModifier": "_720p"
            });
            break;
          }
        case 540:
          {
            hlsOutputs.Outputs.push({
              "Preset": presets.h540p,
              "NameModifier": "_540p"
            });
            break;
          }
        case 360:
          {
            hlsOutputs.Outputs.push({
              "Preset": presets.h360p,
              "NameModifier": "_360p"
            });
            break;
          }
        case 270:
          {
            hlsOutputs.Outputs.push({
              "Preset": presets.h270p,
              "NameModifier": "_270p"
            });
            break;
          }
        default:
          {
            console.log('No presets defined');
          }
      }
    }
    params.Settings.OutputGroups.push(hlsOutputs);
  }

  if (event.dash && event.dash.length > 0) {
    for (let i = event.dash.length - 1; i >= 0; i--) {
      switch (event.dash[i]) {
        case 1080:
          {
            dashOutputs.Outputs.push({
              "Preset": presets.d1080p,
              "NameModifier": "_1080p"
            });
            break;
          }
        case 720:
          {
            dashOutputs.Outputs.push({
              "Preset": presets.d720p,
              "NameModifier": "_720p"
            });
            break;
          }
        case 540:
          {
            dashOutputs.Outputs.push({
              "Preset": presets.d540p,
              "NameModifier": "_540p"
            });
            break;
          }
        case 360:
          {
            dashOutputs.Outputs.push({
              "Preset": presets.d360p,
              "NameModifier": "_360p"
            });
            break;
          }
        case 270:
          {
            dashOutputs.Outputs.push({
              "Preset": presets.d270p,
              "NameModifier": "_270p"
            });
            break;
          }
        default:
          {
            console.log('No presets defined');
          }
      }
    }
    dashOutputs.Outputs.push({
      "Preset": presets.audio,
      "NameModifier": "_audio"
    });
    params.Settings.OutputGroups.push(dashOutputs);
  }

  if (event.frameCapture) {
    if (event.mp4) params.Settings.OutputGroups.push(mp4FrameCapture);
    if (event.hls || event.dash) params.Settings.OutputGroups.push(abrFrameCapture);
  }

  const mediaconvert = new AWS.MediaConvert({
    endpoint: process.env.EndPoint
  });

    mediaconvert.createJob(params).promise()
  .then(data => {
    event.ecodeJobId = data.Job.Id;
    console.log(JSON.stringify(data, null, 2));
    callback(null, event);
  })
    .catch(err => {
    console.log(err);
    error.handler(event, err);
    callback(err);
  });
};
