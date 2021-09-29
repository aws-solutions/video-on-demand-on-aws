import { Construct } from 'constructs';
import { aws_route53 as route53 } from 'aws-cdk-lib';
import { aws_route53_targets as targets } from 'aws-cdk-lib';

export interface Route53ssProps {
  cloudFrontDomainBase: string | undefined;
  hostedZoneId: string;
}

export class Route53s extends Construct {
  public readonly hostedZone: route53.IHostedZone;
  public userPoolDomainA_Record: route53.ARecord;
  public userPoolDomainTarget: targets.UserPoolDomainTarget;
  public userPoolDomainRecordTarget: route53.RecordTarget;

  constructor(scope: Construct, id: string, props: Route53ssProps) {
    super(scope, id);

    const cloudFrontDomainBaseCheck =
      props.cloudFrontDomainBase !== undefined &&
      props.cloudFrontDomainBase &&
      props.cloudFrontDomainBase !== '';

    const hostedZoneCheck =
      props.hostedZoneId !== undefined &&
      props.hostedZoneId &&
      props.hostedZoneId !== '';

    // Only create the following if all of the required information
    // for a domain name has been provided
    if (hostedZoneCheck && cloudFrontDomainBaseCheck) {
      this.hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        'ExternalCloudFrontHostedZone',
        {
          hostedZoneId: props.hostedZoneId,
          zoneName: props.cloudFrontDomainBase ?? '',
        }
      );
    }
  }
}
