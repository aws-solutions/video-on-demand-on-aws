const lambda = require("../index")


describe('#INVOKE::', () => {
  process.env.AWS_REGION = 'eu-west-1';
  process.env.AWS_LAMBDA_FUNCTION_NAME = 'foo';
  process.env.ErrorHandler = 'bar';
  process.env.IngestWorkflow = 'arn:aws:states:eu-west-1:053041861227:stateMachine:buzzhub-ingest';
  process.env.ProcessWorkflow = 'arn:aws:states:eu-west-1:053041861227:stateMachine:buzzhub-process';
  process.env.PublishWorkflow = 'arn:aws:states:eu-west-1:053041861227:stateMachine:buzzhub-publish';

  it("INGEST", async () => {
    const data = await lambda.handler({
      "Records": [
        {
          "eventVersion": "2.1",
          "eventSource": "aws:s3",
          "awsRegion": "eu-west-1",
          "eventTime": "2021-09-14T14:16:13.453Z",
          "eventName": "ObjectCreated:Copy",
          "userIdentity": {
            "principalId": "AWS:AROAQYWMKSJVWY7QFQAZ2:peruggia-sub"
          },
          "requestParameters": {
            "sourceIPAddress": "54.154.128.7"
          },
          "responseElements": {
            "x-amz-request-id": "XQXRMDCN9GZ3NWN2",
            "x-amz-id-2": "ID5tZU5BEBMHEOqrGLsfS61TQuCJ4/uQM7yWWR/5nHia/wx3O2lqZ2pgQ/HjMgNXskQhyxkQOJqKvUIFChQJ7ztr3vTPq4Yr"
          },
          "s3": {
            "s3SchemaVersion": "1.0",
            "configurationId": "mp4",
            "bucket": {
              "name": "buzzhub-master-videos-053041861227-eu-west-1",
              "ownerIdentity": {
                "principalId": "A2JJZGPFKLPHQR"
              },
              "arn": "arn:aws:s3:::buzzhub-master-videos-053041861227-eu-west-1"
            },
            "object": {
              "key": "2021/09/HkpKWVxdF-k3/sozialdemokraten-gewinnen-norwegische-parlamentswahl.mp4",
              "size": 62967683,
              "eTag": "c5600de05af79ad4172a1c76f0b4542f",
              "sequencer": "006140AEA2365517B3"
            }
          }
        }
      ]
    });

    console.log(data);
  });

  it("PROCESS", async () => {
    const data = await lambda.handler({
      "startTime": "2021-11-02T09:33:31.857Z",
      "workflowTrigger": "Video",
      "workflowStatus": "Ingest",
      "workflowName": "buzzhub",
      "frameCapture": true,
      "archiveSource": "DEEP_ARCHIVE",
      "jobTemplate_1080p": "buzzhub_Ott_1080p_Avc_Aac_16x9_qvbr_no_preset",
      "jobTemplate_1080p_no_audio": "buzzhub_Ott_1080p_Avc_16x9_qvbr_no_preset",
      "jobTemplate_720p": "buzzhub_Ott_720p_Avc_Aac_16x9_qvbr_no_preset",
      "jobTemplate_720p_no_audio": "buzzhub_Ott_720p_Avc_16x9_qvbr_no_preset",
      "inputRotate": "DEGREE_0",
      "acceleratedTranscoding": "PREFERRED",
      "enableSns": true,
      "enableSqs": true,
      "doPurge": false,
      "cmsId": "4bDSt1XOvNSn",
      "cmsCommandId": "eJ2Qh0Mfpmm-5X9i7IcPU",
      "srcBucket": "buzzhub-master-videos-053041861227-eu-west-1",
      "srcVideo": "2021/11/4bDSt1XOvNSn/berliner-staatsanwaltschaft-enttarnt-spitzel-im-fall-attila-hildmann.mp4",
      "srcMediainfo": "{\n  \"filename\": \"2021/11/4bDSt1XOvNSn/berliner-staatsanwaltschaft-enttarnt-spitzel-im-fall-attila-hildmann.mp4\",\n  \"container\": {\n    \"format\": \"MPEG-4\",\n    \"fileSize\": 93435798,\n    \"duration\": 94.066,\n    \"totalBitrate\": 7946403\n  },\n  \"video\": [\n    {\n      \"codec\": \"AVC\",\n      \"profile\": \"High@L4\",\n      \"bitrate\": 7744000,\n      \"duration\": 93.661,\n      \"frameCount\": 2807,\n      \"width\": 1920,\n      \"height\": 1080,\n      \"framerate\": 29.97,\n      \"scanType\": \"Progressive\",\n      \"aspectRatio\": \"1.778\",\n      \"bitDepth\": 8,\n      \"colorSpace\": \"YUV 4:2:0\"\n    }\n  ],\n  \"audio\": [\n    {\n      \"codec\": \"AAC\",\n      \"bitrate\": 186884,\n      \"duration\": 94.066,\n      \"frameCount\": 4052,\n      \"bitrateMode\": \"VBR\",\n      \"channels\": 1,\n      \"samplingRate\": 44100,\n      \"samplePerFrame\": 1024\n    }\n  ]\n}",
      "execution_guid": "eJ2Qh0Mfpmm-5X9i7IcPU",
      "guid": "eJ2Qh0Mfpmm-5X9i7IcPU"
    });

    console.log(data);
  });

  it("PUBLISH", async () => {
    const data = await lambda.handler({
      "version": "0",
      "id": "15825240-1c21-e814-0315-870cf848fe85",
      "detail-type": "MediaConvert Job State Change",
      "source": "aws.mediaconvert",
      "account": "053041861227",
      "time": "2021-11-02T09:35:20Z",
      "region": "eu-west-1",
      "resources": [
        "arn:aws:mediaconvert:eu-west-1:053041861227:jobs/1635845627440-knb1xf"
      ],
      "detail": {
        "timestamp": 1635845720107,
        "accountId": "053041861227",
        "queue": "arn:aws:mediaconvert:eu-west-1:053041861227:queues/Default",
        "jobId": "1635845627440-knb1xf",
        "status": "COMPLETE",
        "userMetadata": {
          "guid": "eJ2Qh0Mfpmm-5X9i7IcPU",
          "cmsId": "4bDSt1XOvNSn",
          "cmsCommandId": "eJ2Qh0Mfpmm-5X9i7IcPU",
          "workflow": "buzzhub"
        },
        "outputGroupDetails": [
          {
            "outputDetails": [
              {
                "outputFilePaths": [
                  "s3://buzzhub-transcoded-videos-053041861227-eu-west-1/2021/11/4bDSt1XOvNSn/hls/berliner-staatsanwaltschaft-enttarnt-spitzel-im-fall-attila-hildmann_Ott_Hls_Ts_Avc_Aac_16x9_480x270p_15Hz_0.4Mbps_qvbr.m3u8"
                ],
                "durationInMs": 93666,
                "videoDetails": {
                  "widthInPx": 480,
                  "heightInPx": 270
                }
              },
              {
                "outputFilePaths": [
                  "s3://buzzhub-transcoded-videos-053041861227-eu-west-1/2021/11/4bDSt1XOvNSn/hls/berliner-staatsanwaltschaft-enttarnt-spitzel-im-fall-attila-hildmann_Ott_Hls_Ts_Avc_Aac_16x9_640x360p_30Hz_1.5Mbps_qvbr.m3u8"
                ],
                "durationInMs": 93666,
                "videoDetails": {
                  "widthInPx": 640,
                  "heightInPx": 360
                }
              },
              {
                "outputFilePaths": [
                  "s3://buzzhub-transcoded-videos-053041861227-eu-west-1/2021/11/4bDSt1XOvNSn/hls/berliner-staatsanwaltschaft-enttarnt-spitzel-im-fall-attila-hildmann_Ott_Hls_Ts_Avc_Aac_16x9_960x540p_30Hz_3.5Mbps_qvbr.m3u8"
                ],
                "durationInMs": 93666,
                "videoDetails": {
                  "widthInPx": 960,
                  "heightInPx": 540
                }
              },
              {
                "outputFilePaths": [
                  "s3://buzzhub-transcoded-videos-053041861227-eu-west-1/2021/11/4bDSt1XOvNSn/hls/berliner-staatsanwaltschaft-enttarnt-spitzel-im-fall-attila-hildmann_Ott_Hls_Ts_Avc_Aac_16x9_1280x720p_30Hz_6.0Mbps_qvbr.m3u8"
                ],
                "durationInMs": 93666,
                "videoDetails": {
                  "widthInPx": 1280,
                  "heightInPx": 720
                }
              },
              {
                "outputFilePaths": [
                  "s3://buzzhub-transcoded-videos-053041861227-eu-west-1/2021/11/4bDSt1XOvNSn/hls/berliner-staatsanwaltschaft-enttarnt-spitzel-im-fall-attila-hildmann_Ott_Hls_Ts_Avc_Aac_16x9_1920x1080p_30Hz_8.5Mbps_qvbr.m3u8"
                ],
                "durationInMs": 93666,
                "videoDetails": {
                  "widthInPx": 1920,
                  "heightInPx": 1080
                }
              }
            ],
            "playlistFilePaths": [
              "s3://buzzhub-transcoded-videos-053041861227-eu-west-1/2021/11/4bDSt1XOvNSn/hls/berliner-staatsanwaltschaft-enttarnt-spitzel-im-fall-attila-hildmann.m3u8"
            ],
            "type": "HLS_GROUP"
          },
          {
            "outputDetails": [
              {
                "outputFilePaths": [
                  "s3://buzzhub-transcoded-videos-053041861227-eu-west-1/2021/11/4bDSt1XOvNSn/thumbnails/berliner-staatsanwaltschaft-enttarnt-spitzel-im-fall-attila-hildmann_thumb.0000018.jpg"
                ],
                "durationInMs": 95000,
                "videoDetails": {
                  "widthInPx": 1920,
                  "heightInPx": 1080
                }
              }
            ],
            "type": "FILE_GROUP"
          }
        ]
      }
    });

    console.log(data);
  });
});