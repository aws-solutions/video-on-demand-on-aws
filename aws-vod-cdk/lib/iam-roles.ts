import { Construct } from 'constructs';
import { Stack, aws_iam as iam } from 'aws-cdk-lib';
import { Cognitos } from './cognitos';
import { PolicyStatements } from './policy-statements';
import { PolicyDocuments } from './policy-documents';

export interface IamRolesProps {
  cognitos: Cognitos;
  policyDocuments: PolicyDocuments;
  policyStatements: PolicyStatements;
  stackName: string;
}

export class IamRoles extends Construct {
  public readonly appSync: iam.Role;
  public readonly appSyncReadOnly: iam.Role;
  public readonly archiveSource: iam.Role;
  public readonly cognitoPostConfirmationTrigger: iam.Role;
  public readonly customResource: iam.Role;
  public readonly dynamoDbUpdate: iam.Role;
  public readonly encode: iam.Role;
  public readonly errorHandler: iam.Role;
  public readonly inputValidate: iam.Role;
  public readonly mediaConvert: iam.Role;
  public readonly mediaInfo: iam.Role;
  public readonly mediaPackageAssets: iam.Role;
  public readonly mediaPackageVod: iam.Role;
  public readonly outputValidate: iam.Role;
  public readonly profiler: iam.Role;
  public readonly snsNotification: iam.Role;
  public readonly sqsSendMessage: iam.Role;
  public readonly stepFunctions: iam.Role;
  public readonly stepFunctionsService: iam.Role;

  constructor(scope: Construct, id: string, props: IamRolesProps) {
    super(scope, id);

    this.appSync = new iam.Role(this, 'AppSyncRole', {
      roleName: `${props.stackName}-AppSyncRole`,
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
      inlinePolicies: {
        [`${props.stackName}-AppSyncRolePolicyDocument`]:
          props.policyDocuments.appSync,
      },
    });

    this.appSyncReadOnly = new iam.Role(this, 'AppSyncReadOnly', {
      roleName: `${props.stackName}-AppSyncReadOnlyRole`,
      assumedBy: new iam.WebIdentityPrincipal(
        'cognito-identity.amazonaws.com'
      ).withConditions({
        StringEquals: {
          'cognito-identity.amazonaws.com:aud': props.cognitos.identityPool.ref,
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'unauthenticated',
        },
      }),
      inlinePolicies: {
        [`${props.stackName}-AppSyncReadOnlyRolePolicyDocument`]:
          props.policyDocuments.appsyncReadOnly,
      },
    });

    this.archiveSource = new iam.Role(this, 'ArchiveSourceRole', {
      roleName: `${props.stackName}-ArchiveSourceRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        [`${props.stackName}-ArchiveSourceRolePolicyDocument`]:
          props.policyDocuments.archiveSource,
      },
    });

    this.cognitoPostConfirmationTrigger = new iam.Role(
      this,
      'CognitoPostConfirmationTrigger',
      {
        roleName: `${props.stackName}-CognitoPostConfirmationTriggerRole`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        // Cannot directly attach an inline policy document here due to circular dependency
        // TODO: Monitor https://github.com/aws/aws-cdk/issues/7016 for closure
        // inlinePolicies: {
        //   [`${props.stackName}-CognitoPostConfirmationTriggerRolePolicyDocument`]:
        //     props.policyDocuments.cognitoPostConfirmationTrigger,
        // },
      }
    );

    // Alternative implementation of policy attachment
    this.cognitoPostConfirmationTrigger.attachInlinePolicy(
      new iam.Policy(
        this,
        `${props.stackName}-CognitoPostConfirmationTriggerRolePolicy`,
        { statements: [props.policyStatements.cognitoPostConfirmationTrigger] }
      )
    );

    this.customResource = new iam.Role(this, 'CustomResourceRole', {
      roleName: `${props.stackName}-CustomResourceRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        [`${props.stackName}-CustomResourceRolePolicyDocument`]:
          props.policyDocuments.customResource,
      },
    });

    this.dynamoDbUpdate = new iam.Role(this, 'DynamoUpdateRole', {
      roleName: `${props.stackName}-DynamoUpdateRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        [`${props.stackName}-DynamoDbUpdateRolePolicyDocument`]:
          props.policyDocuments.dynamoDbUpdate,
      },
    });

    this.encode = new iam.Role(this, 'EncodeRole', {
      roleName: `${props.stackName}-EncodeRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        [`${props.stackName}-EncodeRolePolicyDocument`]:
          props.policyDocuments.encode,
      },
    });

    this.errorHandler = new iam.Role(this, 'ErrorHandlerRole', {
      roleName: `${props.stackName}-ErrorHandlerRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        [`${props.stackName}-ErrorHandlerRolePolicyDocument`]:
          props.policyDocuments.errorHandler,
      },
    });

    this.errorHandler.addToPolicy(
      props.policyStatements.errorHandlerRoleDynamoDb
    );

    this.inputValidate = new iam.Role(this, 'InputValidateRole', {
      roleName: `${props.stackName}-InputValidateRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        [`${props.stackName}-InputValidateRolePolicyDocument`]:
          props.policyDocuments.inputValidate,
      },
    });

    this.mediaConvert = new iam.Role(this, 'MediaConvertRole', {
      roleName: `${props.stackName}-MediaConvertRole`,
      assumedBy: new iam.ServicePrincipal(`mediaconvert.amazonaws.com`),
      inlinePolicies: {
        [`${props.stackName}-MediaConvertRolePolicyDocument`]:
          props.policyDocuments.mediaConvert,
      },
    });

    this.mediaInfo = new iam.Role(this, 'MediaInfoRole', {
      roleName: `${props.stackName}-MediaInfoRole`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
      inlinePolicies: {
        [`${props.stackName}-MediaInfoRolePolicyDocument`]:
          props.policyDocuments.mediaInfo,
      },
    });

    this.mediaPackageAssets = new iam.Role(this, 'MediaPackageAssetsRole', {
      roleName: `${props.stackName}-MediaPackageAssetsRole`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
      inlinePolicies: {
        [`${props.stackName}-MediaPackageAssetsRolePolicyDocument`]:
          props.policyDocuments.mediaPackageAssets,
      },
    });

    this.mediaPackageVod = new iam.Role(this, 'MediaPackageVodRole', {
      roleName: `${props.stackName}-MediaPackageVodRole`,
      assumedBy: new iam.ServicePrincipal(`mediapackage.amazonaws.com`),
      inlinePolicies: {
        [`${props.stackName}-MediaPackageVodRolePolicyDocument`]:
          props.policyDocuments.mediaPackageVod,
      },
    });

    this.outputValidate = new iam.Role(this, 'OutputValidateRole', {
      roleName: `${props.stackName}-OutputValidateRole`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
      inlinePolicies: {
        [`${props.stackName}-OutputValidateRolePolicyDocument`]:
          props.policyDocuments.outputValidate,
      },
    });

    this.profiler = new iam.Role(this, 'ProfilerRole', {
      roleName: `${props.stackName}-ProfilerRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        [`${props.stackName}-ProfilerRolePolicyDocument`]:
          props.policyDocuments.profiler,
      },
    });

    this.snsNotification = new iam.Role(this, 'SnsNotificationRole', {
      roleName: `${props.stackName}-SnsNotificationRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        [`${props.stackName}-SnsNotificationRolePolicyDocument`]:
          props.policyDocuments.snsNotification,
      },
    });

    this.sqsSendMessage = new iam.Role(this, 'SqsSendMessageRole', {
      roleName: `${props.stackName}-SqsSendMessageRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        [`${props.stackName}-SqsSendMessageRolePolicyDocument`]:
          props.policyDocuments.sqsSendMessage,
      },
    });

    this.stepFunctions = new iam.Role(this, 'StepFunctionsRole', {
      roleName: `${props.stackName}-StepFunctionsRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        [`${props.stackName}-StepFunctionsRolePolicyDocument`]:
          props.policyDocuments.stepFunctions,
      },
    });

    this.stepFunctionsService = new iam.Role(this, 'StepFunctionsServiceRole', {
      roleName: `${props.stackName}-StepFunctionsServiceRole`,
      assumedBy: new iam.ServicePrincipal(
        `states.${Stack.of(this).region}.amazonaws.com`
      ),
      inlinePolicies: {
        [`${props.stackName}-StepFunctionsServiceRolePolicyDocument`]:
          props.policyDocuments.stepFunctionsService,
      },
    });
  }
}
