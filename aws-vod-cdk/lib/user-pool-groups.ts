import { Construct } from 'constructs';
import { aws_cognito as cognito, Stack } from 'aws-cdk-lib';
import { Cognitos } from './cognitos';
import { IamRoles } from './iam-roles';
import { readFileSync } from 'fs';

export interface UserPoolGroupsProps {
  cognitos: Cognitos;
  iamRoles: IamRoles;
}

export class UserPoolGroups extends Construct {
  public readonly appSyncReadonlyGroup: cognito.CfnUserPoolGroup;

  constructor(scope: Stack, id: string, props: UserPoolGroupsProps) {
    super(scope, id);

    this.appSyncReadonlyGroup = new cognito.CfnUserPoolGroup(
      this,
      'AppSyncReadOnlyGroup',
      {
        userPoolId: props.cognitos.userPool.userPoolId,
        groupName: 'AppSyncReadOnly',
        precedence: 0,
        roleArn: props.iamRoles.appSyncReadOnly.roleArn,
      }
    );
  }
}
