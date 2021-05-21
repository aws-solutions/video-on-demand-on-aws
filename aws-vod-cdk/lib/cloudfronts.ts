import { Construct } from 'constructs';
import {
  aws_cloudfront as cloudFront,
  aws_cloudfront_origins as origins,
} from 'aws-cdk-lib';
import { S3Buckets } from './s3-buckets';
import { CloudfrontOriginAccessIdentities } from './cloudfront-origin-access-identities';

export interface CloudFrontsProps {
  cloudfrontOriginAccessIdentities: CloudfrontOriginAccessIdentities;
  region: string;
  s3Buckets: S3Buckets;
  stackName: string;
}

export class CloudFronts extends Construct {
  public readonly distribution: cloudFront.Distribution;

  constructor(scope: Construct, id: string, props: CloudFrontsProps) {
    super(scope, id);

    this.distribution = new cloudFront.Distribution(
      this,
      'CloudFrontDistribution',
      {
        domainNames: [
          `${props.s3Buckets.destination}.s3.${props.region}.amazonaws.com`,
        ],
        defaultBehavior: {
          origin: new origins.S3Origin(props.s3Buckets.destination, {
            originAccessIdentity:
              props.cloudfrontOriginAccessIdentities.destination,
          }),
          allowedMethods: cloudFront.AllowedMethods.ALLOW_GET_HEAD,
          compress: true,
          viewerProtocolPolicy:
            cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudFront.CachePolicy(
            this,
            'CloudFrontDistributionCachePolicy',
            {
              cookieBehavior: cloudFront.CacheCookieBehavior.none(),
              headerBehavior: cloudFront.CacheHeaderBehavior.allowList(
                'Origin',
                'Access-Control-Request-Method',
                'Access-Control-Request-Headers'
              ),
              queryStringBehavior: cloudFront.CacheQueryStringBehavior.none(),
            }
          ),
        },
        priceClass: cloudFront.PriceClass.PRICE_CLASS_100,
        enableLogging: true,
        logBucket: props.s3Buckets.logs,
        logFilePrefix: 'cloudfront/',
      }
    );
  }
}
