import { Construct } from 'constructs';
import { aws_wafv2 as wafv2, Stack } from 'aws-cdk-lib';
import { AppSyncs } from './appsyncs';

export interface WafsProps {
  appsyncs: AppSyncs;
  stackName: string;
}

export class Wafs extends Construct {
  public readonly webAcl: wafv2.CfnWebACL;
  public readonly webAclAssociation: wafv2.CfnWebACLAssociation;

  constructor(scope: Stack, id: string, props: WafsProps) {
    super(scope, id);

    this.webAcl = new wafv2.CfnWebACL(this, 'waf', {
      description: `ACL for ${props.stackName} appsync`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `${props.stackName}-Firewall`,
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 1,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
              excludedRules: [
                {
                  name: 'NoUserAgent_HEADER',
                },
              ],
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesCommonRuleSet',
          },
        },
        {
          name: 'LimitRequests100',
          priority: 2,
          action: {
            block: {},
          },
          statement: {
            rateBasedStatement: {
              limit: 100,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'LimitRequests100',
          },
        },
      ],
    });

    this.webAclAssociation = new wafv2.CfnWebACLAssociation(
      this,
      'WebAclAssociation',
      {
        resourceArn: props.appsyncs.videoApi.attrArn,
        webAclArn: this.webAcl.attrArn,
      }
    );

    this.webAclAssociation.addDependsOn(props.appsyncs.videoApi);
  }
}
