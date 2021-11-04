# Video on Demand on AWS

How to implement a video-on-demand workflow on AWS leveraging AWS Step Functions, AWS Elemental MediaConvert, and AWS Elemental MediaPackage.
Source code for [Video on Demand on AWS](https://aws.amazon.com/solutions/video-on-demand-on-aws/) solution.

## On this Page
- [Architecture Overview](#architecture-overview)
- [Deployment](#deployment)
- [Workflow Configuration](#workflow-configuration)
- [Source Metadata Option](#source-metadata-option)
- [Encoding Templates](#encoding-templates)
- [QVBR Mode](#qvbr-mode)
- [Accelerated Transcoding](#accelerated-transcoding)
- [Source Code](#source-code)
- [Creating a custom Build](#creating-a-custom-build)
- [Additional Resources](#additional-resources)

## Architecture Overview
![Architecture](architecture.png)

## About this fork

This forks only purpose is to provide a terraformed version of the original solution. Using our
teams/companies tf-modules or well-known community modules.

We've also reduced some complexity by removing features we were not interested in (e.g. MediaPackage)

## Debugging errors

given there are some failed _MediaConvert Jobs_, you can easily find them using this cmd:

```shell
$ aws mediaconvert list-jobs \
    --max-items 5 \
    --endpoint-url 'https://XXXXXX.mediaconvert.eu-west-1.amazonaws.com' \
    --status ERROR \
    --query 'Jobs[].{mediaId: UserMetadata.cmsId, jobId: Id, ErrorCode: ErrorCode, ErrorMessage: ErrorMessage, time: Timing.SubmitTime}
```

response:

```json
[
    {
        "mediaId": "CYNeCWbX4bMd",
        "jobId": "1635930585113-8o6t1i",
        "ErrorCode": 1075,
        "ErrorMessage": "Demuxer: [invalid AVC header]",
        "time": "2021-11-03T10:09:45+01:00"
    },
    {
        "mediaId": "SdgTbssK2iwz",
        "jobId": "1635927431182-wz7jc0",
        "ErrorCode": 1076,
        "ErrorMessage": "Demuxer: [ReadPacketData File read failed - end of file hit at length [33630142]. Is file truncated?]",
        "time": "2021-11-03T09:17:11+01:00"
    }
]
```

## Additional Resources

### Services
- [AWS Elemental MediaConvert](https://aws.amazon.com/mediaconvert/)
- [AWS Elemental MediaPackage](https://aws.amazon.com/mediapackage/)
- [AWS Step Functions](https://aws.amazon.com/step-functions/)
- [AWS Lambda](https://aws.amazon.com/lambda/)
- [Amazon CloudFront](https://aws.amazon.com/cloudfront/)
- [OTT Workflows](https://www.elemental.com/applications/ott-workflows)
- [QVBR and MediaConvert](https://docs.aws.amazon.com/mediaconvert/latest/ug/cbr-vbr-qvbr.html)

### Other Solutions and Demos
- [Live Streaming On AWS](https://aws.amazon.com/solutions/live-streaming-on-aws/)
- [Media Analysis Solution](https://aws.amazon.com/solutions/media-analysis-solution/)
- [Live Streaming and Live to VOD Workshop](https://github.com/awslabs/speke-reference-server)
- [Live to VOD with Machine Learning](https://github.com/aws-samples/aws-elemental-instant-video-highlights)
- [Demo SPEKE Reference Server](https://github.com/awslabs/speke-reference-server)

***

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
