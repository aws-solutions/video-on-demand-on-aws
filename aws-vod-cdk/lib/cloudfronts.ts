import { Construct } from 'constructs';
import {
  aws_certificatemanager as acm,
  aws_cloudfront as cloudFront,
  aws_cloudfront_origins as origins,
  aws_route53 as route53,
} from 'aws-cdk-lib';
import { S3Buckets } from './s3-buckets';
import { CloudfrontOriginAccessIdentities } from './cloudfront-origin-access-identities';

export interface CloudFrontsProps {
  cloudFrontDomainPrefix: string;
  cloudFrontRootDomain: string;
  cloudfrontOriginAccessIdentities: CloudfrontOriginAccessIdentities;
  hostedZoneId: string;
  region: string;
  s3Buckets: S3Buckets;
  stackName: string;
}

export class CloudFronts extends Construct {
  public readonly distribution: cloudFront.Distribution;
  public readonly certificate: acm.DnsValidatedCertificate;
  public readonly hostedZone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: CloudFrontsProps) {
    super(scope, id);

    this.hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      'ExternalHostedZone',
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.cloudFrontRootDomain,
      }
    );

    this.certificate = new acm.DnsValidatedCertificate(
      this,
      `${props.cloudFrontRootDomain}-DnsValidatedCertificate`,
      {
        domainName: `${props.cloudFrontDomainPrefix}.${props.cloudFrontRootDomain}`,
        hostedZone: this.hostedZone,
      }
    );

    this.distribution = new cloudFront.Distribution(
      this,
      'CloudFrontDistribution',
      {
        domainNames: [
          `${props.cloudFrontDomainPrefix}.${props.cloudFrontRootDomain}`,
        ],
        certificate: this.certificate,
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
