# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
