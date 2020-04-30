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

const lambda = require('./index.js');
const testAssets = require('./test-assets');

const _stackName = 'test-stack';
const _groupId = 'test-packaging-group';

const validParameters = {
    StackName: _stackName,
    GroupId: _groupId,
    PackagingConfigurations: 'HLS,DASH',
    DistributionId: testAssets.DistributionId,
    EnableMediaPackage: 'true'
};

const listAssetsResponse = {
    Assets: [{
        Arn: 'asset-arn',
        Id: 'asset-id',
        PackagingGroupId: 'test-packaging-group',
        ResourceId: 'resource-id',
        SourceArn: 'source-arn',
        SourceRoleArn: 'source-role'
    }]
};

const listConfigurationsResponse = {
    PackagingConfigurations: [{
        Arn: 'config-arn',
        Id: 'MSS',
        MssPackage: {
            MssManifests: [{
                ManifestName: 'index'
            }],
            SegmentDurationSeconds: 6
        },
        PackagingGroupId: 'test-packaging-group'
    }]
};

const groupResponse = {
    Id: _groupId,
    DomainName: testAssets.DomainName
};

describe('#MEDIAPACKAGE-VOD::', () => {
    afterEach(() => {
        AWS.restore('MediaPackageVod');
        AWS.restore('CloudFront');
    });

    describe('Create', () => {
        it('should succeed with valid parameters', async () => {
            AWS.mock('MediaPackageVod', 'createPackagingGroup', Promise.resolve(groupResponse));
            AWS.mock('MediaPackageVod', 'createPackagingConfiguration', Promise.resolve());
            AWS.mock('CloudFront', 'getDistributionConfig', Promise.resolve(testAssets.ConfigurationWithMP));

            const response = await lambda.create(validParameters);
            expect(response.GroupId).to.equal(_groupId);
        });

        it('should ignore duplicate configurations', async () => {
            let callCount = 0;

            AWS.mock('MediaPackageVod', 'createPackagingGroup', Promise.resolve(groupResponse));
            AWS.mock('MediaPackageVod', 'createPackagingConfiguration', () => {
                callCount++;
                return Promise.resolve();
            });
            AWS.mock('CloudFront', 'getDistributionConfig', Promise.resolve(testAssets.ConfigurationWithMP));

            const duplicateConfigParams = {
                StackName: _stackName,
                GroupId: _groupId,
                PackagingConfigurations: 'HLS,DASH,HLS',
                DistributionId: testAssets.DistributionId
            };

            const response = await lambda.create(duplicateConfigParams);
            expect(response.GroupId).to.equal(_groupId);
            expect(callCount).to.equal(2);
        });

        it('should succeed when at least one valid configuration is informed', async () => {
            AWS.mock('MediaPackageVod', 'createPackagingGroup', Promise.resolve(groupResponse));
            AWS.mock('MediaPackageVod', 'createPackagingConfiguration', Promise.resolve());
            AWS.mock('CloudFront', 'getDistributionConfig', Promise.resolve(testAssets.ConfigurationWithMP));

            const singleInvalidParams = {
                StackName: _stackName,
                GroupId: _groupId,
                PackagingConfigurations: 'HLS,bogus',
                DistributionId: testAssets.DistributionId
            };

            const response = await lambda.create(singleInvalidParams);
            expect(response.GroupId).to.equal(_groupId);
        });

        it('should fail when createPackagingGroup throws an exception', async () => {
            AWS.mock('MediaPackageVod', 'createPackagingGroup', Promise.reject('some error'));

            try {
                await lambda.create(validParameters);
            } catch (error) {
                expect(error).to.not.be.null;
                expect(error).to.equal('some error');
                return;
            }

            expect.fail('exception should have been thrown');
        });

        it('should fail when no valid configurations are informed', async () => {
            AWS.mock('MediaPackageVod', 'createPackagingGroup', Promise.resolve(groupResponse));

            const invalidParameters = {
                StackName: _stackName,
                GroupId: _groupId,
                PackagingConfigurations: 'bogus'
            };

            try {
                await lambda.create(invalidParameters);
            } catch (error) {
                expect(error).to.not.be.null;
                return;
            }

            expect.fail('exception should have been thrown');
        });

        it('should fail when createPackagingConfiguration throws an exception', async () => {
            AWS.mock('MediaPackageVod', 'createPackagingGroup', Promise.resolve(groupResponse));
            AWS.mock('MediaPackageVod', 'createPackagingConfiguration', Promise.reject('some error'));

            try {
                await lambda.create(validParameters);
            } catch (error) {
                expect(error).to.not.be.null;
                expect(error).to.equal('some error');
                return;
            }

            expect.fail('exception should have been thrown');
        });

        it('should fail when getDistributionConfig throws an exception', async () => {
            AWS.mock('MediaPackageVod', 'createPackagingGroup', Promise.resolve(groupResponse));
            AWS.mock('MediaPackageVod', 'createPackagingConfiguration', Promise.resolve());
            AWS.mock('CloudFront', 'getDistributionConfig', Promise.reject('some error'));

            try {
                await lambda.create(validParameters);
            } catch (error) {
                expect(error).to.not.be.null;
                expect(error).to.equal('some error');
                return;
            }

            expect.fail('exception should have been thrown');
        });
    });

    describe('Update', () => {
        it('should not try to add the origin if mediapackage is not enabled', async () => {
            let callCount = 0;

            AWS.mock('MediaPackageVod', 'describePackagingGroup', Promise.resolve(groupResponse));
            AWS.mock('CloudFront', 'getDistributionConfig', Promise.resolve(testAssets.ConfigurationWithS3));
            AWS.mock('CloudFront', 'updateDistribution', () => {
                callCount++;
                return Promise.resolve();
            });

            const disabledMediaPackageParams = {
                StackName: _stackName,
                GroupId: _groupId,
                PackagingConfigurations: 'HLS,DASH',
                DistributionId: testAssets.DistributionId,
                EnableMediaPackage: 'false'
            };

            await lambda.update(disabledMediaPackageParams);
            expect(callCount).to.equal(0);
        });

        it('should add the origin if it does not exist', async () => {
            let callCount = 0;

            AWS.mock('MediaPackageVod', 'describePackagingGroup', Promise.resolve(groupResponse));
            AWS.mock('CloudFront', 'getDistributionConfig', Promise.resolve(testAssets.ConfigurationWithS3));
            AWS.mock('CloudFront', 'updateDistribution', () => {
                callCount++;
                return Promise.resolve();
            });

            await lambda.update(validParameters);
            expect(callCount).to.equal(1);
        });
    });

    describe('Delete', () => {
        it('should succeed when group exists', async () => {
            AWS.mock('MediaPackageVod', 'listAssets', Promise.resolve(listAssetsResponse));
            AWS.mock('MediaPackageVod', 'listPackagingConfigurations', Promise.resolve(listConfigurationsResponse));

            AWS.mock('MediaPackageVod', 'deleteAsset', Promise.resolve());
            AWS.mock('MediaPackageVod', 'deletePackagingConfiguration', Promise.resolve());
            AWS.mock('MediaPackageVod', 'deletePackagingGroup', Promise.resolve());

            const response = await lambda.purge(validParameters);
            expect(response.GroupId).to.equal(_groupId);
        });

        it('should succeed when group is not found', async () => {
            const emptyAssetsResponse = { Assets: [] };
            AWS.mock('MediaPackageVod', 'listAssets', Promise.resolve(emptyAssetsResponse));

            const emptyConfigsResponse = { PackagingConfigurations: [] };
            AWS.mock('MediaPackageVod', 'listPackagingConfigurations', Promise.resolve(emptyConfigsResponse));

            AWS.mock('MediaPackageVod', 'deleteAsset', Promise.resolve());
            AWS.mock('MediaPackageVod', 'deletePackagingConfiguration', Promise.resolve());
            AWS.mock('MediaPackageVod', 'deletePackagingGroup', Promise.reject({
                code: 'NotFoundException'
            }));

            const response = await lambda.purge(validParameters);
            expect(response.GroupId).to.equal(_groupId);
        });

        it('should fail when exception is unknown', async () => {
            AWS.mock('MediaPackageVod', 'listAssets', Promise.resolve(listAssetsResponse));
            AWS.mock('MediaPackageVod', 'listPackagingConfigurations', Promise.resolve(listConfigurationsResponse));

            AWS.mock('MediaPackageVod', 'deleteAsset', Promise.resolve());
            AWS.mock('MediaPackageVod', 'deletePackagingConfiguration', Promise.resolve());
            AWS.mock('MediaPackageVod', 'deletePackagingGroup', Promise.reject({
                code: 'SomethingElse'
            }));

            try {
                await lambda.purge(validParameters);
            } catch (error) {
                expect(error).to.not.be.null;
                return;
            }

            expect.fail('exception should have been thrown');
        });
    });
});