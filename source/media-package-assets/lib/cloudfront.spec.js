/*********************************************************************************************************************
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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
const _ = require('lodash');

const path = require('path');
const AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const helper = require('./cloudfront');

const _distributionId = 'distribution-id';
const _domainName = 'bogus.cloudfront.net';
const _mediaPackageEndpoints = [
    {
        PackagingConfigurationId: 'packaging-config-hls',
        Url: 'https://test.com/out/index.m3u8'
    }
];

const _distConfig = {
    ETag: 'some-etag',
    DistributionConfig: {
        CallerReference: 'some-caller-reference',
        Origins: {
            Quantity: 1,
            Items: [{
                Id: 's3Origin',
                DomainName: 'some-bucket.s3.us-east-1.amazonaws.com',
                OriginPath: '',
                CustomHeaders: {
                    Quantity: 0
                },
                S3OriginConfig: {
                    OriginAccessIdentity: 'origin-access-identity/cloudfront/some-oai'
                }
            }]
        },
        DefaultCacheBehavior: {
            TargetOriginId: 's3Origin',
            ForwardedValues: {
                QueryString: false,
                Cookies: { Forward: 'none' },
                Headers: {
                    Quantity: 3,
                    Items: [
                        'Access-Control-Request-Headers',
                        'Access-Control-Request-Method',
                        'Origin'
                    ]
                },
                QueryStringCacheKeys: { Quantity: 0 }
            },
            TrustedSigners: { Enabled: false, Quantity: 0 },
            ViewerProtocolPolicy: 'allow-all',
            MinTTL: 0
        },
        CacheBehaviors: { Quantity: 0 },
        Comment: '',
        Enabled: true
    }
};

describe('#CLOUDFRONT::', () => {
    describe('validation', () => {
        it('should throw an exception when distribution id is undefined', async () => {
            try {
                await helper.convertEndpoints(undefined, _domainName, _mediaPackageEndpoints);
            } catch (error) {
                expect(error).to.not.be.null;
                return;
            }

            expect.fail('exception should have been thrown');
        });

        it('should throw an exception when domain name is undefined', async () => {
            try {
                await helper.convertEndpoints(_distributionId, undefined, _mediaPackageEndpoints);
            } catch (error) {
                expect(error).to.not.be.null;
                return;
            }

            expect.fail('exception should have been thrown');
        });

        it('should throw an exception when endpoints is empty', async () => {
            try {
                await helper.convertEndpoints(_distributionId, _domainName, []);
            } catch (error) {
                expect(error).to.not.be.null;
                return;
            }

            expect.fail('exception should have been thrown');
        });
    });

    describe('api', () => {
        afterEach(() => AWS.restore('CloudFront'));

        it('should throw an exception when getDistributionConfig fails', async () => {
            try {
                AWS.mock('CloudFront', 'getDistributionConfig', Promise.reject('some error'));

                await helper.convertEndpoints(_distributionId, _domainName, _mediaPackageEndpoints);
            } catch (error) {
                expect(error).to.not.be.null;
                return;
            }

            expect.fail('exception should have been thrown');
        });

        it('should throw an exception when updateDistribution fails with something other than PreconditionFailed', async () => {
            try {
                const config = _.cloneDeep(_distConfig);

                AWS.mock('CloudFront', 'getDistributionConfig', Promise.resolve(config));
                AWS.mock('CloudFront', 'updateDistribution', Promise.reject({ code: 'some error' }));

                await helper.convertEndpoints(_distributionId, _domainName, _mediaPackageEndpoints);
            } catch (error) {
                expect(error).to.not.be.null;
                return;
            }

            expect.fail('exception should have been thrown');
        });

        it('should not throw an exception when updateDistribution fails with PreconditionFailed', async () => {
            const config = _.cloneDeep(_distConfig);

            AWS.mock('CloudFront', 'getDistributionConfig', Promise.resolve(config));
            AWS.mock('CloudFront', 'updateDistribution', Promise.reject({ code: 'PreconditionFailed' }));

            const response = await helper.convertEndpoints(_distributionId, _domainName, _mediaPackageEndpoints);
            expect(response).not.to.be.undefined;
        });

        it('should succeed with valid parameters', async () => {
            const config = _.cloneDeep(_distConfig);

            AWS.mock('CloudFront', 'getDistributionConfig', Promise.resolve(config));
            AWS.mock('CloudFront', 'updateDistribution', Promise.resolve());

            const response = await helper.convertEndpoints(_distributionId, _domainName, _mediaPackageEndpoints);
            expect(response).to.deep.equal({ 'HLS': 'https://bogus.cloudfront.net/out/index.m3u8' });
        });
    });
});
