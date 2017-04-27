
# Video on Demand on AWS

How to implement a video-on-demand workflow on AWS leveraging AWS Step Functions and Elastic Transcoder.

Source code for the AWS solution [Video on Demand on AWS](https://aws.amazon.com/answers/media-entertainment/video-on-demand-on-aws/).

## CloudFormation template

- cfn/video-on-demand.template

## source code node.js 4.3:

lambda/functions - Micro services that make up the AWS Step Functions.
- **dynamo-entry**      - creates the initial DynamoDB entry for the source video.
- **encode-hls**        - creates an HLS encode job on Elastic Transcoder based on the profiler.
- **encode-mp4**        - creates an MP4 encode job on Elastic Transcoder based on the profiler.
- **ingest-execute**    - triggers ingest step functions workflow on s3 put object event.
- **metadata**          - creates a json metadata file for the mp4 output.
- **preset-check**      - determines if the ETS complete job is HLS or MP4.
- **profiler**          - determines which ETS profile to use based on the source video height.
- **publish-execute**   - triggers publish step functions workflow on ETS completion.
- **publish**           - publishes workflow results to SNS

lambda/mediainfo
- **index**         - runs mediainfo executable on s3 signed url. https://mediaarea.net/en/MediaInfo

lambda/metrics
- **index**         - Anonymous data

lambda/resources - Custom Resources for CloudFormation to deploy Elastic Transcoder, AWS Step Functions and more.
- **cloudfront-identity**   - creates a CF identity.
- **ets-pipeline**          - creates ETS pipeline.
- **ets-presets**           - creates ETS presents based on Apple tech note from 2016.
- **ingest-stepfunctions**  - creates the ingest state machine.
- **publish-stepfunctions** - creates the ingest state machine.
- **s3-notification**       - creates s3 events for put objects on the source bucket to trigger ingest-execute.
- **sns-subscription**      - subscribes publish-execute to the ETS Complete SNS topic.


***

Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
