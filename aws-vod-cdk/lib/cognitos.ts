import { Construct } from 'constructs';
import { aws_cognito as cognito, Stack } from 'aws-cdk-lib';
import { aws_route53 as route53 } from 'aws-cdk-lib';
import { aws_route53_targets as targets } from 'aws-cdk-lib';
import { CertificateManagers } from './certificate-managers';
import { Route53s } from './route53s';
import { readFileSync } from 'fs';

export interface CognitosProps {
  authenticationDomain: string | undefined;
  authenticationSubDomain: string | undefined;
  certificateManagers: CertificateManagers;
  cloudFrontDomainBase: string | undefined;
  hostedZoneId: string;
  prependDomainWithStackStage: boolean;
  route53s: Route53s;
  stackName: string;
  stackStage: string;
}

export class Cognitos extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolDomain: cognito.UserPoolDomain;
  public readonly userPoolIdentityProviderAmazon: cognito.UserPoolIdentityProviderAmazon;
  public readonly userPoolIdentityProviderApple: cognito.UserPoolIdentityProviderApple;
  public readonly userPoolIdentityProviderFacebook: cognito.UserPoolIdentityProviderFacebook;
  public readonly userPoolIdentityProviderGoogle: cognito.UserPoolIdentityProviderGoogle;
  public readonly identityPool: cognito.CfnIdentityPool;
  public readonly appSyncReadonlyGroup: cognito.CfnUserPoolGroup;

  constructor(scope: Stack, id: string, props: CognitosProps) {
    super(scope, id);

    const requiredAndMutable = {
      required: true,
      mutable: true,
    };

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${props.stackName}-UserPool`,
      selfSignUpEnabled: true,
      standardAttributes: {
        givenName: requiredAndMutable,
        familyName: requiredAndMutable,
        email: requiredAndMutable,
      },
      signInAliases: {
        username: true,
        email: true,
      },
      autoVerify: {
        email: true,
      },
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPoolClientName: `${props.stackName}-UserPoolClient`,
      userPool: this.userPool,
      generateSecret: false,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    const authenticationDomainCheck =
      props.authenticationDomain !== undefined &&
      props.authenticationDomain &&
      props.authenticationDomain !== '';

    const authenticationSubDomainCheck =
      props.authenticationSubDomain !== undefined &&
      props.authenticationSubDomain &&
      props.authenticationSubDomain !== '';

    const cloudFrontDomainBaseCheck =
      props.cloudFrontDomainBase !== undefined &&
      props.cloudFrontDomainBase &&
      props.cloudFrontDomainBase !== '';

    const hostedZoneCheck =
      props.hostedZoneId !== undefined &&
      props.hostedZoneId &&
      props.hostedZoneId !== '';

    if (
      hostedZoneCheck &&
      authenticationDomainCheck &&
      authenticationSubDomainCheck &&
      cloudFrontDomainBaseCheck
    ) {
      this.userPoolDomain = new cognito.UserPoolDomain(this, 'UserPoolDomain', {
        userPool: this.userPool,
        customDomain: {
          certificate: props.certificateManagers.authenticationCertificate,
          domainName: props.authenticationDomain ?? '',
        },
      });

      props.route53s.userPoolDomainTarget = new targets.UserPoolDomainTarget(
        this.userPoolDomain
      );

      props.route53s.userPoolDomainRecordTarget =
        route53.RecordTarget.fromAlias(props.route53s.userPoolDomainTarget);

      props.route53s.userPoolDomainA_Record = new route53.ARecord(
        this,
        'UserPoolDomainCloudFrontAliasRecord',
        {
          zone: props.route53s.hostedZone,
          recordName: props.authenticationDomain,
          target: props.route53s.userPoolDomainRecordTarget,
        }
      );

      this.userPoolIdentityProviderAmazon =
        new cognito.UserPoolIdentityProviderAmazon(
          this,
          'AmazonIdentityProvider',
          {
            clientId:
              'amzn1.application-oa2-client.51f6744ddddf44d8ba08740d37036496',
            clientSecret:
              'a58ad810facaf95ed7111e4bbc9dd46014319d9a1daae8f9f3578ae15d0edab4',
            userPool: this.userPool,
          }
        );

      this.userPoolIdentityProviderApple =
        new cognito.UserPoolIdentityProviderApple(
          this,
          'AppleIdentityProvider',
          {
            clientId: 'com.trineyoga.auth.dev',
            keyId: '487QAPVXY4',
            privateKey: readFileSync('./lib/cognito/Apple_AuthKey.p8', 'utf-8'),
            teamId: 'com.trineyoga',
            userPool: this.userPool,
            scopes: ['name', 'email'],
          }
        );

      this.userPoolIdentityProviderFacebook =
        new cognito.UserPoolIdentityProviderFacebook(
          this,
          'FacebookIdentityProvider',
          {
            clientId: '336680764531853',
            clientSecret: 'eecd7c376fdb1dddad514e0ad8560e49',
            userPool: this.userPool,
          }
        );

      this.userPoolIdentityProviderGoogle =
        new cognito.UserPoolIdentityProviderGoogle(
          this,
          'GoogleIdentityProvider',
          {
            clientId:
              '353032571217-ngafj5a94lsj4rge6je0ijpg6dhkdhp3.apps.googleusercontent.com',
            clientSecret: 'x3BgTDD0V2kEKQycLYfndWuX',
            userPool: this.userPool,
          }
        );
    }

    this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: `${props.stackName}-IdentityPool`,
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          providerName: this.userPool.userPoolProviderName,
          clientId: this.userPoolClient.userPoolClientId,
        },
      ],
    });
  }
}
