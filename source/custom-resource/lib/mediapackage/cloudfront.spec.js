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
const _ = require('lodash');

const path = require('path');
const AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const helper = require('./cloudfront');
const testAssets = require('./test-assets');

describe('#CLOUDFRONT::', () => {
    describe('Validation', () => {
        it('should throw an exception when distribution id is undefined', async () => {
            try {
                await helper.addCustomOrigin(undefined, testAssets.DomainName);
            } catch (error) {
                expect(error).to.not.be.null;
                return;
            }

            expect.fail('exception should have been thrown');
        });

        it('should throw an exception when domain name is undefined', async () => {
            try {
                await helper.addCustomOrigin(testAssets.DistributionId, undefined);
            } catch (error) {
                expect(error).to.not.be.null;
                return;
            }

            expect.fail('exception should have been thrown');
        });
    });

    describe('Api', () => {
        afterEach(() => AWS.restore('CloudFront'));

        it('should throw an exception when updateDistribution fails with something other than PreconditionFailed', async () => {
            try {
                const config = _.cloneDeep(testAssets.ConfigurationWithS3);

                AWS.mock('CloudFront', 'getDistributionConfig', Promise.resolve(config));
                AWS.mock('CloudFront', 'updateDistribution', Promise.reject({ code: 'some error' }));

                await helper.addCustomOrigin(testAssets.DistributionId, testAssets.DomainName);
            } catch (error) {
                expect(error).to.not.be.null;
                return;
            }

            expect.fail('exception should have been thrown');
        });

        it('should not throw an exception when updateDistribution fails with PreconditionFailed', async () => {
            const config = _.cloneDeep(testAssets.ConfigurationWithS3);

            AWS.mock('CloudFront', 'getDistributionConfig', Promise.resolve(config));
            AWS.mock('CloudFront', 'updateDistribution', Promise.reject({ code: 'PreconditionFailed' }));

            await helper.addCustomOrigin(testAssets.DistributionId, testAssets.DomainName);
        });

        it('should not add origin if it already exists', async () => {
            let callCount = 0;

            const config = _.cloneDeep(testAssets.ConfigurationWithS3);
            config.DistributionConfig.Origins.Quantity = 2;
            config.DistributionConfig.Origins.Items.push({ Id: 'vodMPOrigin' });

            AWS.mock('CloudFront', 'getDistributionConfig', Promise.resolve(config));
            AWS.mock('CloudFront', 'updateDistribution', () => {
                callCount++;
                return Promise.resolve();
            });

            await helper.addCustomOrigin(testAssets.DistributionId, testAssets.DomainName);
            expect(callCount).to.equal(0);
        });

        it('should succeed with valid parameters', async () => {
            const config = _.cloneDeep(testAssets.ConfigurationWithS3);

            AWS.mock('CloudFront', 'getDistributionConfig', Promise.resolve(config));
            AWS.mock('CloudFront', 'updateDistribution', Promise.resolve());

            await helper.addCustomOrigin(testAssets.DistributionId, testAssets.DomainName);
        });
    });
});
