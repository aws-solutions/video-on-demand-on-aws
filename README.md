# Video on Demand on AWS

How to implement a video-on-demand workflow on AWS leveraging AWS Step Functions and AWS Elemental MediaConvert. Source code for the AWS solution [Video on Demand on AWS](https://aws.amazon.com/answers/media-entertainment/video-on-demand-on-aws/).


## On this Page
- [Architecture Overview](#architecture-overview)
- [Deployment](#deployment)
- [Workflow Configuration](#workflow-configuration)
- [Source Metadata Option](#source-metadata-option)
- [Source Code](#source-code)
- [Encoding Templates](#encoding-profiles)
- [Creating a custom Build](#creating-a-custom-build)
- [Additional Resources](#additional-resources)


## Architecture Overview

![Architecture](architecture.png)


## Deployment
The solution is deployed using a CloudFormation template with a lambda backed custom resource. For details on deploying the solution please see the details on the solution home page: [Video on Demand on AWS](https://aws.amazon.com/answers/media-entertainment/video-on-demand-on-aws/)


## Workflow Configuration
The workflow configuration is defined as environment variables for the Ingest Validate lambda function which is the first step in the ingest process.

#### Environment Variable::
* **Archive Source:**	If enabled the source video file will be tagged for archiving to glacier and the end of the workflow
* **CloudFront**	CloudFront Domain name, used to generate the playback URLs for the MediaConvert outputs
* **Destination:**	The name of the Destination S3 bucket for all of the MediaConvert outputs
* **FrameCapture:**	If enabled frame capture is added to the job submitted to MediaConvert
* **MediaConvert_Template_2160p:**	The name of the UHD template in MediaConvert
* **MediaConvert_Template_1080p:**	The name of the HD template in MediaConvert
* **MediaConvert_Template_720p:**	The name of the SD template in MediaConvert
* **Source:**	The name of the Source S3 bucket.
* **WorkflowName:**	Used to tag all of the MediaConvert Encoding Jobs.

 These are the default settings for the workflow, configured when deploying the CloudFormation template and apply to all source videos uploaded to the Source S3 bucket. If the solution is deployed with the source metadata option any of the settings can be overwritten using a source metadata file.


## Source Metadata Option
When the solution is deployed with the source metadata parameter the source S3 bucket is configured with an event notification that will trigger the workflow when a JSON file is uploaded. This allow different workflow configuration to be defined for each source video processed by the workflow.


> **Important::** The source video file MUST be uploaded to S3 before the metadata file is uploaded, the metadata file must be valid JSON with a .json file extention. With source metadata enabled uploading video files to Amazon S3 will not trigger the workflow.

**Example JSON metadata file::**
```
{
    "srcVideo": "example.mpg",
    "ArchiveSource": true,
    "FrameCapture":false,
    "JobTemplate":"custom-job-template"
}
```

The example metadata file above will overwrite the default settings for the workflow for ArchiveSource, FrameCapture and set the template to use for the encoding.

The only required field for the metadata file is the srcVideo and the workflow will default to the environment variables settings for the ingest validate lambda function for any settings not defined in the metadata file.

**Full list of options::**
```
{
    "srcVideo": "string",
    "ArchiveSource": boolean,
    "FrameCapture": boolean,
    "Source":"string",
    "destination":"string",
    "CloudFront":"string",
    "MediaConvert_Template_2160p":"string",
    "MediaConvert_Template_1080p":"string",
    "MediaConvert_Template_720p":"string",
    "JobTemplate":"custom-job-template",
    "InputRotate": "DEGREE_0"
}
```

The video-on-demand solution also supports adding additional metadata, such as title, genre, or any other information, you want to store in Amazon DynamoDB.

## Encoding Templates
At launch the Solution creates 3 MediaConvert job templates which are used as the default encoding templates for the workflow:

**MediaConvert_Template_2160p::** 3 mp4 outputs including HEVC and AVC 2160p through 720p, 8 HLS outputs AVC 1080p through 270p and 8 DASH outputs AVC 1080p through 270p

**MediaConvert_Template_1080p::** 2 mp4 outputs AVC 2160p through 720p, 8 HLS outputs AVC 1080p through 270p and 8 DASH outputs AVC 1080p through 270p

**MediaConvert_Template_720p::** 1 mp4 720p AVC output, 7 HLS outputs AVC 720p through 270p and 7 DASH outputs AVC 720p through 270p

By default, the profiler step in the process step function will check the source video height and set the parameter “JobTemplate” to one of the available templates. This variable is then passed to the encoding step which submits a job to Elemental MediaConvert. To customizing the encoding templates used by the solution you can either replace the existing templates or you can use the source metadata version of the workflow and define the JobTemplate as part of the source metadata file.

**To replace the templates::**
1.	Use the system templates or create 3 new templates through the MediaConvert console, see the Elemental MediaConvert documentation for details.
2.	Update the environment variables for the ingest validate lambda function with the names of the new templates.

**To define the job template using metadata::**
1.	Launch the solution with source metadata parameter. See Appendix E for more details.
2.	Use the system templates or create a new templates through the MediaConvert console, see the Elemental MediaConvert documentation for details.
3.	Add “JobTemplate”:”name of the template” to the metadata file, this will overwrite the profiler step in the process Step Functions.


## Source code (Nodejs 8.10)
* **archive-source:** Lambda function to tag the source video in s3 to enable the Glacier lifecycle policy.
* **encode:** Lambda function to submit an encoding job to Elemental MediaConvert  
* **mediainfo:** Lambda function to run mediainfo on s3 signed url. https://mediaarea.net/en/MediaInfo. bin/mediainfo must be made executable before deploying to lambda.
* **custom-resource:** Lambda backed CloudFormation custom resource to deploy MediaConvert templates configure S3
event notifications.
* **error-handler:** Lambda function to handler any errors created by the workflow or MediaConvert.
* **output-validate:** Lambda function to parse MediaConvert CloudWatch Events
* **step-functions:** Lambda function to trigger AWS Step Functions
* **dynamo:** Lambda function to Update DynamoDB
* **input-validate:** Lambda function to parse S3 event notfications and define the workflow parameters.
* **profiler:** Lambda function used to send publish and/or error notifications.


## Creating a custom Build
The solution can be deployed through the CloudFormation template available on the solution home page: [Video on Demand on AWS](https://aws.amazon.com/answers/media-entertainment/video-on-demand-on-aws/).
 To make changes to the solution, download or clone this repo, update the source code and then run the deployment/build-s3-dist.sh script to deploy the updated Lambda code to an S3 bucket in your account.

### Pre-requirements:
* [AWS Command Line Interface](https://aws.amazon.com/cli/)
* Node.js 8.x or Python 3.x

### 1. Create an Amazon S3 Bucket.
The CloudFormation template is configured to pull the Lambda deployment packages from Amazon S3 bucket in the region the template is being launched in. Create a bucket in the desired region with the region name appended to the name of the bucket. eg: for us-east-1 create a bucket named: ```bucket-us-east-1```

### 2. Create the deployment packages:
Run the build-s3-dist.sh script, passing in 2 variables:
* CODEBUCKET = the name of the S3 bucket (do NOT include the -region extension)
* CODEVERSION = this will be the subfolder containing the code (video-on-demand-on-aws/*codeversion*).

This will:
* copy the console files to ./deployment/dist/.
* copy the CloudFormation template to ./deployment/dist/ and updates the source code mappings.
* zip and copy the source code to ./deployment/dist/

Example:
```
  cd deployment/
  ./build-s3-dist.sh bucket 1.01
```
 This will deploy the source code to:
```
  s3://bucket-us-east-1/video-on-demand-on-aws/1.01/.
```
And update the CloudFormation template mappings:
```
  SourceCode:
    General:
      S3Bucket: bucket
      KeyPrefix: video-on-demand-on-aws/1.01
```

### 3. Upload the Code to Amazon S3.

Use the AWS CLI to sync the lambda code and demo console files to amazon S3:

 ```
   cd deployment/
   aws s3 sync .dist/ s3://bucket-us-east-1/video-on-demand-on-aws/1.01/.
 ```

### 4. Launch the CloudFormation template.

Launch the updated CloudFormation template from ```deployment/dist/``` folder.


## Additional Resources

### Services
- [AWS Elemental MediaConvert](https://aws.amazon.com/mediaconvert/)
- [AWS Step Functions](https://aws.amazon.com/mediapackage/)
- [AWS Lambda](https://aws.amazon.com/lambda/)
- [Amazon CloudFront](https://aws.amazon.com/cloudfront/)
- [OTT Workflows](https://www.elemental.com/applications/ott-workflows)

### Other Solutions and Demos
- [Live Streaming On AWS](https://aws.amazon.com/answers/media-entertainment/live-streaming/)
- [Media Analysis Solution](https://aws.amazon.com/answers/media-entertainment/media-analysis-solution/)
- [Live Streaming and Live to VOD Workshop](https://github.com/awslabs/speke-reference-server)
- [Live to VOD with Machine Learning](https://github.com/aws-samples/aws-elemental-instant-video-highlights)
- [Demo SPEKE Reference Server](https://github.com/awslabs/speke-reference-server)



***

Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
