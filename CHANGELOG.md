# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [6.1.2] - 2023-5-01
### Added
- Created unique cachePolicyName for CloudFront cache policy allowing the stack to deployed multiple times across regions.
- Added unique prefix for Application Registry name so if a stack update is performance the new application will show up in app manager.
- Added package-lock files to show snapshot of packages used during build.

### Removed
- Removed github action workflow files

## [6.1.1] - 2023-4-17
### Changed
- Updated object ownership configuration on the CloudFormation logging bucket

## [6.1.0] - 2023-2-27
### Changed
- Added region name and account ID to AppRegistry Application name
- Changed AppRegistry Attribute Group name to Region-StackName
- Updated AppRegistry attribute and tag names

### Fixed
- #155 appRegistry associateStack has been deprecated

## [6.0.0] - 2022-10-17
### Added
- Added cdk infrastructure in source/cdk directory
- Defined resources for cdk stack in source/cdk/lib/vod-stack.ts
- Added snapshot test to source/cdk/test directory
- Added SolutionId tag to resources
- Added cdk nag rule suppressions
- Added Service Catalog AppRegistry configuration

### Changed
- Removed CloudFormation template video-on-demand-on-aws.yaml
- Upgrade path from old versions require a delete and re-deploy since moving to CDK
- Use CachePolicy instead of ForwardedValues(deprecated) for cloudfront distribution
- Use @aws-solutions-constructs/aws-cloudfront-s3 construct for cloudfront distribution and destination bucket origin
- Updated deployment/build-s3-dist.sh to output cdk nag errors
- Updated to uuid v9

### Fixed
- Fixed mergeSettingsWithDefault arguments. Closes this issue (https://github.com/aws-solutions/video-on-demand-on-aws/issues/137)

### Contributors
* @sandimciin

## [5.3.1] - 2021-12-16
### Fixed
- Fixed spelling errors in CloudFormation template.

## [5.3.0] - 2021-11-17
### Added 
- Added new input file types wmv, mkv, m3u8, mpeg, webm, and h264. 
- Now allowing uppercase input file types to run the end to end video encoding workflow.
- Added the MXF and mxf file types. Closes this request (https://github.com/aws-solutions/video-on-demand-on-aws/issues/124)
- Additional headers added to Amazon CloudFront distribution attached to destination bucket for the out/* prefix. This will allow easier playback of content on modern browsers. Additional headers whitelisted are Origin, Access-Control-Allow-Origin, Access-Control-Request-Method, and Access-Control-Request-Headers.
- Additional methods added to Amazon CloudFront distribution for destination bucket. Head and options added.

### Changed
- Added steps in Readme to make building the project more clear. 
- Added Readme build step to ensure bucket ownership when uploading build files.
- Removed deinterlacer preprocessor from templates to reduce costs. This causes MediaConvert jobs to run in Basic Tier mode instead of Pro Tier.
- Modified job templates that force output frame rate to 30, 24, or 15 fps to instead follow the source fps of your video file. This allows 60fps content, as well as PAL 25/50 fps video files to have their frame rate preserved. 
- Removed Dash and MP4 outputs, leaving just the HLS output. This saves costs running this solution.
- Removed SelectorType and Tracks from job profiles, we will auto pick the first track. This allows audio only videos to encode without having an error.
- Changed AWS MediaConvert templates codecLevel to auto to allow for more supported input file types.
- Changed AWS MediaConvert audio track to auto to allow for video only workflows. This allows video files without audio track to work with the included AWS MediaConvert profiles. 

### Fixed
- Fixed naming in the MediaConvert custom resource. Closes this PR (https://github.com/aws-solutions/video-on-demand-on-aws/pull/84)
- Update Axios package to 0.21.1

## [5.2.0] - 2020-12-10
### Added 
- Support for S3 Signature Version4 for pre-signed URLs (https://github.com/awslabs/video-on-demand-on-aws/pull/111)
- New MediaConvert job templates with:
    - Fewer HLS and DASH ABR renditions
    - Updated encoder settings
    - No presets
- Enabled point-in-time recovery backup for DynamoDB table

### Changed
- MediaInfo executable version (from v19.09 to v20.09) (https://github.com/awslabs/video-on-demand-on-aws/pull/116)
- CloudFront configuration improvements (https://github.com/awslabs/video-on-demand-on-aws/pull/96, https://github.com/awslabs/video-on-demand-on-aws/pull/99)
- MediaConvert presets are no longer being created
- All new MediaConvert job templates gets created regardless of whether MediaPackage is enabled or not

### Fixed
- Settings are no longer overwritten when using custom templates (https://github.com/awslabs/video-on-demand-on-aws/pull/107)
- Solution now deploys even in regions with no MediaPackage support


## [5.1.0] - 2020-04-30
### Added
- Default encryption to SNS topic
- Environment variable to configure the AWS SDK to reuse TCP connections (https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/node-reusing-connections.html)
- SQS queue options at deployment to capture workflow outputs
- Support for accelerated transcoding in Elemental MediaCoonvert: https://aws.amazon.com/about-aws/whats-new/2019/10/announcing-new-aws-elemental-mediaconvert-features-for-accelerated-transcoding-dash-and-avc-video-quality/
- support for Glacier deep archive

### Changed
- Lambda functions runtime to latest available (Node.js 12)
- Build assets to include package-lock.json files
- Build and test commands to use _npm ci_ instead of _npm install_
- Cloudformation template to use _AWS::Partition_ instead of _aws_
- Logic to add MediaPackage VOD as a custom origin to CloudFront (it's now done as a custom resource when the stack is created / updated)

### Fixed
- Links in README file
- fix to buildUrl function in output-validate lambda to support non root objects (https://github.com/awslabs/video-on-demand-on-aws/issues/61)
- fix mediainfo lambda function signing method error (https://github.com/awslabs/video-on-demand-on-aws/issues/670

### Removed
- _'use strict'_ directives

## [5.0.0] - 2019-11-20
### Added
- MediaPackage VOD support
- Rotation support (https://github.com/awslabs/video-on-demand-on-aws/pull/27)

### Changed
- License to Apache-2.0
- Time properties in notification event (startTime and endTime) to use ISO 8601 formatting
- README to use correct casing for metadata sample
- Always use QVBR (Quality-Defined Variable Bitrate Control)
- DynamoDB table to use on-demand billing option
- Each function in the workflow to have its own role

### Fixed
- Typo in notification event property name (ecodeJobId -> encodeJobId)
- Links to issues in the CONTRIBUTING file
- Anonymous metrics helper to remove ServiceToken (which includes Lambda ARN) from sent data
- Suffix for supported format (mv4 -> m4v)
- Custom resource to handle WorkflowTrigger parameter update

### Removed
- References to unused workflowTrigger (Api)

## [4.3.0] - 2019-11-20
### Added
- CHANGELOG file

### Changed
- Lambda functions (except for mediainfo) runtime to nodejs10.x
- Mediainfo lambda function to python3.7
- Mediainfo executable version (from v0.7.92.1 to v19.09)
