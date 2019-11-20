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

const AWS = require('aws-sdk');

module.exports.convertEndpoints = async (distributionId, domainName, mediaPackageEndpoints) => {
    if (!distributionId) {
        throw new Error('distributionId must be informed');
    }

    if (!domainName) {
        throw new Error('domainName must be informed');
    }

    if (!mediaPackageEndpoints || mediaPackageEndpoints.length === 0) {
        throw new Error('mediaPackageEndpoints must contain at least one value');
    }

    const cloudFront = new AWS.CloudFront();
    const originId = 'vodMPOrigin';
    const url = new URL(mediaPackageEndpoints[0].Url);

    const response = await cloudFront.getDistributionConfig({ Id: distributionId }).promise();
    const config = response.DistributionConfig;

    const originExists = config.Origins.Items.some(item => item.Id === originId);
    if (!originExists) {
        console.log(`Adding MediaPackage as origin to distribution ${distributionId}`);

        const customOrigin = {
            Id: originId,
            DomainName: url.hostname,
            OriginPath: '',
            CustomHeaders: { Quantity: 0 },
            CustomOriginConfig: {
                HTTPPort: 80,
                HTTPSPort: url.port || 443,
                OriginProtocolPolicy: 'https-only',
                OriginSslProtocols: { Quantity: 1, Items: ['TLSv1.2'] },
                OriginReadTimeout: 30,
                OriginKeepaliveTimeout: 5
            }
        };

        config.Origins.Quantity = config.Origins.Items.push(customOrigin);

        const customBehavior = {
            PathPattern: 'out/*',
            TargetOriginId: originId,
            ForwardedValues: {
                QueryString: false,
                Cookies: { Forward: 'none' },
                Headers: { Quantity: 0 },
                QueryStringCacheKeys: { Quantity: 0 }
            },
            TrustedSigners: { Enabled: false, Quantity: 0 },
            ViewerProtocolPolicy: 'redirect-to-https',
            MinTTL: 0,
            AllowedMethods: {
                Quantity: 2,
                Items: ['HEAD', 'GET'],
                CachedMethods: { Quantity: 2, Items: ['HEAD', 'GET'] }
            },
            SmoothStreaming: false,
            DefaultTTL: 86400,
            MaxTTL: 31536000,
            Compress: false,
            LambdaFunctionAssociations: { Quantity: 0 },
            FieldLevelEncryptionId: ''
        };

        if (config.CacheBehaviors.Items) {
            config.CacheBehaviors.Items.push(customBehavior);
        } else {
            config.CacheBehaviors.Items = [customBehavior];
        }

        config.CacheBehaviors.Quantity = config.CacheBehaviors.Items.length;

        try {
            const params = {
                Id: distributionId,
                DistributionConfig: config,
                IfMatch: response.ETag
            };

            await cloudFront.updateDistribution(params).promise();
            console.log(`Origins:: ${JSON.stringify(config.Origins.Items, null, 2)}`);
            console.log(`Cache behaviors:: ${JSON.stringify(config.CacheBehaviors.Items, null, 2)}`);
        } catch (error) {
            /*
                The updateDistribution operation throws a PreconditionFailed error if
                the ETag returned by getDistributionConfig is not valid anymore.

                This means that the distribution was already updated, probably by another
                file uploaded to S3 at the same time. We can safely ignore this error since
                the custom origin only has to be added once.
            */
            if (error.code !== 'PreconditionFailed') {
                throw error;
            }
        }
    }

    let updatedEndpoints = {};

    mediaPackageEndpoints.forEach(endpoint => {
        const parts = endpoint.PackagingConfigurationId.split('-');
        const config = parts.pop().toUpperCase();

        updatedEndpoints[config] = endpoint.Url.replace(url.hostname, domainName);
    });

    return updatedEndpoints;
};
