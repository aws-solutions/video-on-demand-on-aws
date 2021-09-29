import { Construct } from 'constructs';
import { aws_certificatemanager as acm } from 'aws-cdk-lib';
import { Route53s } from './route53s';

export interface CertificateManagersProps {
  authenticationDomain: string | undefined;
  authenticationSubDomain: string | undefined;
  cloudFrontDomainBase: string | undefined;
  hostedZoneId: string;
  route53s: Route53s;
  videosDomain: string | undefined;
}

export class CertificateManagers extends Construct {
  public readonly authenticationCertificate: acm.DnsValidatedCertificate;
  public readonly cloudFrontCertificate: acm.DnsValidatedCertificate;

  constructor(scope: Construct, id: string, props: CertificateManagersProps) {
    super(scope, id);

    const authenticationDomainCheck =
      props.authenticationDomain !== undefined &&
      props.authenticationDomain &&
      props.authenticationDomain !== '';

    const cloudFrontDomainBaseCheck =
      props.cloudFrontDomainBase !== undefined &&
      props.cloudFrontDomainBase &&
      props.cloudFrontDomainBase !== '';

    const videosDomainCheck =
      props.videosDomain !== undefined &&
      props.videosDomain &&
      props.videosDomain !== '';

    const hostedZoneCheck =
      props.hostedZoneId !== undefined &&
      props.hostedZoneId &&
      props.hostedZoneId !== '';

    // Only create the following if all of the required information
    // for a domain name has been provided
    if (
      hostedZoneCheck &&
      authenticationDomainCheck &&
      cloudFrontDomainBaseCheck
    ) {
      this.authenticationCertificate = new acm.DnsValidatedCertificate(
        this,
        `${props.authenticationDomain}-Certificate`,
        {
          domainName: props.cloudFrontDomainBase ?? '',
          hostedZone: props.route53s.hostedZone,
          subjectAlternativeNames: [
            `*.${props.cloudFrontDomainBase}`,
            props.authenticationDomain ?? '',
          ],
        }
      );
    }

    // Only create the following if all of the required information
    // for a domain name has been provided
    if (hostedZoneCheck && videosDomainCheck && cloudFrontDomainBaseCheck) {
      this.cloudFrontCertificate = new acm.DnsValidatedCertificate(
        this,
        `${props.videosDomain}-DnsValidatedCertificate`,
        {
          domainName: props.cloudFrontDomainBase ?? '',
          hostedZone: props.route53s.hostedZone,
          subjectAlternativeNames: [
            `*.${props.cloudFrontDomainBase}`,
            props.videosDomain ?? '',
          ],
        }
      );
    }
  }
}
