import { Construct } from 'constructs';
import { aws_stepfunctions as stepfunctions } from 'aws-cdk-lib';

export interface StepFunctionsChoicesProps {
  stackName: string;
  stackStage: string;
}

export class StepFunctionsChoices extends Construct {
  // Ingest Workflow Choices
  public readonly ingestWorkflowSnsChoice: stepfunctions.Choice;

  // Process Workflow Choices
  public readonly processWorkflowAcceleratedTranscodingCheck: stepfunctions.Choice;
  public readonly processWorkflowEncodingProfileCheck: stepfunctions.Choice;
  public readonly processWorkflowFrameCaptureCheck: stepfunctions.Choice;

  // Publish Workflow Choices
  public readonly publishWorkflowArchiveSource: stepfunctions.Choice;
  public readonly publishWorkflowMediaPackage: stepfunctions.Choice;
  public readonly publishWorkflowSns: stepfunctions.Choice;
  public readonly publishWorkflowSqs: stepfunctions.Choice;

  constructor(scope: Construct, id: string, props: StepFunctionsChoicesProps) {
    super(scope, id);

    this.ingestWorkflowSnsChoice = new stepfunctions.Choice(
      this,
      'IngestWorkflowSnsChoice'
    );

    this.processWorkflowAcceleratedTranscodingCheck = new stepfunctions.Choice(
      this,
      'ProcessWorkflowAcceleratedTranscodingCheckChoice'
    );

    this.processWorkflowEncodingProfileCheck = new stepfunctions.Choice(
      this,
      'ProcessWorkflowEncodingProfileCheckChoice'
    );

    this.processWorkflowFrameCaptureCheck = new stepfunctions.Choice(
      this,
      'ProcessWorkflowFrameCaptureCheckChoice'
    );

    this.publishWorkflowArchiveSource = new stepfunctions.Choice(
      this,
      'PublishWorkflowArchiveSourceChoice'
    );

    this.publishWorkflowMediaPackage = new stepfunctions.Choice(
      this,
      'PublishWorkflowMediaPackageChoice'
    );

    this.publishWorkflowSns = new stepfunctions.Choice(
      this,
      'PublishWorkflowSnsChoice'
    );

    this.publishWorkflowSqs = new stepfunctions.Choice(
      this,
      'PublishWorkflowSqsChoice'
    );
  }
}
