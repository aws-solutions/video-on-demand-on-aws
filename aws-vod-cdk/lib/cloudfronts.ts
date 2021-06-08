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
  cloudFrontDomain: string;
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

    const hostedZoneCheck =
      props.hostedZoneId !== undefined &&
      props.hostedZoneId &&
      props.hostedZoneId !== '';

    const cloudFrontDomainCheck =
      props.cloudFrontDomain !== undefined &&
      props.cloudFrontDomain &&
      props.cloudFrontDomain !== '';

    // Only create the following if all of the required information
    // for a domain name has been provided
    if (hostedZoneCheck && cloudFrontDomainCheck) {
      this.hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        'ExternalHostedZone',
        {
          hostedZoneId: props.hostedZoneId,
          zoneName: props.cloudFrontDomain,
        }
      );

      this.certificate = new acm.DnsValidatedCertificate(
        this,
        `${props.cloudFrontDomain}-DnsValidatedCertificate`,
        {
          domainName: `${props.cloudFrontDomain}`,
          hostedZone: this.hostedZone,
        }
      );
    }

    this.distribution = new cloudFront.Distribution(
      this,
      'CloudFrontDistribution',
      {
        // Only create a domain name if all of the pieces are required
        domainNames:
          hostedZoneCheck && cloudFrontDomainCheck
            ? [`${props.cloudFrontDomain}`]
            : undefined,
        certificate:
          // Only add the certificate if required
          hostedZoneCheck && cloudFrontDomainCheck
            ? this.certificate
            : undefined,
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
