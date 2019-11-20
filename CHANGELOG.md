# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

