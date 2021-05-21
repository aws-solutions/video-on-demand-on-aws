import { Construct } from 'constructs';
import { aws_stepfunctions_tasks as tasks } from 'aws-cdk-lib';

export interface StepFunctionsTasksProps {
  stackName: string;
}

export class StepFunctionsTasks extends Construct {
  // Ingest Workflow Tasks
  public readonly ingestWorkflowInputValidate: tasks.LambdaInvoke;
  public readonly ingestWorkflowMediaInfo: tasks.LambdaInvoke;
  public readonly ingestWorkflowDynamoDbUpdate: tasks.LambdaInvoke;
  public readonly ingestWorkflowSnsNotifications: tasks.LambdaInvoke;
  public readonly ingestWorkflowProcessExecute: tasks.LambdaInvoke;

  // Process Workflow Tasks
  public readonly processWorkflowProfiler: tasks.LambdaInvoke;
  public readonly processWorkflowEncodeJobSubmit: tasks.LambdaInvoke;
  public readonly processWorkflowDynamoDbUpdate: tasks.LambdaInvoke;

  // Publish Workflow Tasks
  public readonly publishWorkflowValidateEncodingOutput: tasks.LambdaInvoke;
  public readonly publishWorkflowArchive: tasks.LambdaInvoke;
  public readonly publishWorkflowDeepArchive: tasks.LambdaInvoke;
  public readonly publishWorkflowMediaPackageAssets: tasks.LambdaInvoke;
  public readonly publishWorkflowDynamoDbUpdate: tasks.LambdaInvoke;
  public readonly publishWorkflowSqsSendMessage: tasks.LambdaInvoke;
  public readonly publishWorkflowSnsNotification: tasks.LambdaInvoke;

  constructor(scope: Construct, id: string, props: StepFunctionsTasksProps) {
    super(scope, id);
  }
}
