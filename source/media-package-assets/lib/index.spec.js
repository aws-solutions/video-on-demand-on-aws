/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const expect = require('chai').expect;
const path = require('path');
const AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const lambda = require('../index.js');

const _domainName = 'https://random-id.egress.mediapackage-vod.us-east-1.amazonaws.com';

const createAssetResponse = {
    Arn: 'asset-arn',
    EgressEndpoints: [
        {
            PackagingConfigurationId: 'packaging-config-hls',
            Url: `${_domainName}/out/index.m3u8`
        },
        {
            PackagingConfigurationId: 'packaging-config-dash',
            Url: `${_domainName}/out/index.mpd`
        }
    ],
    Id: 'asset-id',
    PackagingGroupId: 'packaging-group-id',
    ResourceId: 'resource-id',
    SourceArn: 'source-file-arn',
    SourceRoleArn: 'test-vod-role'
};

describe('#INGEST::', () => {
    describe('Asset', () => {
        process.env.DistributionId = 'distribution-id';
        process.env.GroupId = 'test-packaging-group';
        process.env.GroupDomainName = _domainName;
        process.env.MediaPackageVodRole = 'test-vod-role';
        process.env.ErrorHandler = 'error_handler';

        afterEach(() => {
            AWS.restore('MediaPackageVod');
            AWS.restore('Lambda');
        });

        it('should succeed with valid parameters', async () => {
            AWS.mock('MediaPackageVod', 'createAsset', Promise.resolve(createAssetResponse));

            const event = {
                guid: 'ce791447-277c-4a8c-9a0d-c3ed28b495ea',
                srcVideo: 'video.mp4',
                hlsPlaylist: 's3://my-bucket/video.m3u8',
                cloudFront: 'DABCDEF0123456.cloudfront.net'
            };

            const response = await lambda.handler(event);
            expect(response.guid).to.equal(event.guid);
            expect(response.srcVideo).to.equal(event.srcVideo);
            expect(response.egressEndpoints['HLS']).to.equal('https://DABCDEF0123456.cloudfront.net/out/index.m3u8');
            expect(response.egressEndpoints['DASH']).to.equal('https://DABCDEF0123456.cloudfront.net/out/index.mpd');
        });

        it('should fail when createAsset throws an exception', async () => {
            AWS.mock('MediaPackageVod', 'createAsset', Promise.reject('some error'));
            AWS.mock('Lambda', 'invoke', Promise.resolve());

            const event = {
                guid: 'ce791447-277c-4a8c-9a0d-c3ed28b495ea',
                srcVideo: 'video.mp4',
                hlsPlaylist: 's3://my-bucket/video.m3u8'
            };

            try {
                await lambda.handler(event);
            } catch (error) {
                expect(error).to.not.be.null;
                expect(error).to.equal('some error');
                return;
            }

            expect.fail('exception should have been thrown');
        });
    });

    describe('s3Uri parsing', () => {
        it('should correctly parse s3Uri without subfolders', () => {
            const actual = lambda.buildArnFromUri('s3://my-bucket/video.m3u8');
            expect(actual).to.equal('arn:aws:s3:::my-bucket/video.m3u8');
        });

        it('should correctly parse s3Uri with subfolders', () => {
            const actual = lambda.buildArnFromUri('s3://my-bucket/output/hls/video.m3u8');
            expect(actual).to.equal('arn:aws:s3:::my-bucket/output/hls/video.m3u8');
        });

        it('should fail when s3Uri is not in correct format', () => {
            try {
                lambda.buildArnFromUri('bogus');
            } catch (error) {
                expect(error).to.not.be.null;
                return;
            }

            expect.fail('exception should have been thrown');
        });
    });
});