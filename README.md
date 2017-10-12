
# Video on Demand on AWS

How to implement a video-on-demand workflow on AWS leveraging AWS Step Functions and Elastic Transcoder.

Source code for the AWS solution [Video on Demand on AWS](https://aws.amazon.com/answers/media-entertainment/video-on-demand-on-aws/).


## CloudFormation templates
There are 2 CloudFormation templates, one for a video only workflow and a second to deploy a workflow that ingest both a source video file and metadata file. For the video only version the encoding options are defined as CloudFormation parameters. For the metadata version the encoding options are defined for each video in the metadata file.


## source code node.js 6.10:

**source/custom-resources**:
A series of CloudFormation custom resources used to deploy ElasticTranscoder, AWS Step Functions and make configuration changes to SNS, S3 and CloudFront.

**source/dynamo**
A Lambda function to update DynamoDB, used in each of the Step Functions workflows.

**source/error-handler**
A Lambda function to handle workflow and ElasticTranscoder errors

**source/ingest**
The Lambda functions that make up the core of the ingest workflow.

**source/mediainfo**
A Lambda function to run mediainfo on s3 signed url. https://mediaarea.net/en/MediaInfo. bin/mediainfo must be made executable before deploying to lambda.

**source/process**
The Lambda functions that make up the core of the process workflow.

**source/publish**
The Lambda functions that make up the core of the publish workflow.


## Building the Lambda Packages
We recommend building this package on Amazon Linux because the target Lambda environment will run on Amazon Linux and the build process compiles MediaInfo

```bash
# Install Development Tools necessary to compile MediaInfo
sudo yum groupinstall 'Development Tools' -y
# Install library required to add CURL support to Mediainfo
sudo yum install libcurl-devel -y

cd deployment
./build-s3-dist.sh source-bucket-base-name
```
source-bucket-base-name should be the base name for the S3 bucket location where the template will source the Lambda code from.
The template will append '-[region_name]' to this value.
For example: ./build-s3-dist.sh solutions
The template will then expect the source code to be located in the solutions-[region_name] bucket

## CF template and Lambda functions
Located in deployment/dist after running build-s3-dist.sh


***

Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
