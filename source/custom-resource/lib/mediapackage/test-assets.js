const ConfigurationWithS3 = {
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

const ConfigurationWithMP = {
    DistributionConfig: {
        Origins: {
            Items: [{ Id: 'vodMPOrigin' }],
            Quantity: 1
        }
    }
};

module.exports = {
    ConfigurationWithS3,
    ConfigurationWithMP,
    DistributionId: 'distribution-id',
    DomainName: 'https://random-id.egress.mediapackage-vod.us-east-1.amazonaws.com'
};
