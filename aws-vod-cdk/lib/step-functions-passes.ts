import { Construct } from 'constructs';
import { aws_stepfunctions as stepfunctions } from 'aws-cdk-lib';

export interface StepFunctionsPassesProps {
  stackName: string;
}

export class StepFunctionsPasses extends Construct {
  // Process Workflow Passes
  public readonly processWorkflowAcceleratedTranscodingDisabled: stepfunctions.Pass;
  public readonly processWorkflowAcceleratedTranscodingEnabled: stepfunctions.Pass;
  public readonly processWorkflowAcceleratedTranscodingPreferred: stepfunctions.Pass;
  public readonly processWorkflowCustomJobTemplate: stepfunctions.Pass;
  public readonly processWorkflowFrameCaptureOff: stepfunctions.Pass;
  public readonly processWorkflowFrameCaptureOn: stepfunctions.Pass;
  public readonly processWorkflowJobTemplate1080p: stepfunctions.Pass;
  public readonly processWorkflowJobTemplate2160p: stepfunctions.Pass;
  public readonly processWorkflowJobTemplate720p: stepfunctions.Pass;

  // Publish Workflow Passes
  public readonly publishWorkflowComplete: stepfunctions.Pass;

  constructor(scope: Construct, id: string, props: StepFunctionsPassesProps) {
    super(scope, id);

    this.processWorkflowAcceleratedTranscodingDisabled = new stepfunctions.Pass(
      this,
      'ProcessWorkflowAcceleratedTranscodingDisabledPass'
    );

    this.processWorkflowAcceleratedTranscodingEnabled = new stepfunctions.Pass(
      this,
      'processWorkflowAcceleratedTranscodingEnabledPass'
    );

    this.processWorkflowAcceleratedTranscodingPreferred =
      new stepfunctions.Pass(
        this,
        'processWorkflowAcceleratedTranscodingPreferredPass'
      );

    this.processWorkflowCustomJobTemplate = new stepfunctions.Pass(
      this,
      'ProcessWorkflowCustomJobTemplatePass'
    );

    this.processWorkflowFrameCaptureOff = new stepfunctions.Pass(
      this,
      'ProcessWorkflowFrameCaptureOffPass'
    );

    this.processWorkflowFrameCaptureOn = new stepfunctions.Pass(
      this,
      'ProcessWorkflowFrameCaptureOnPass'
    );

    this.processWorkflowJobTemplate1080p = new stepfunctions.Pass(
      this,
      'ProcessWorkflowJobTemplate1080pPass'
    );

    this.processWorkflowJobTemplate2160p = new stepfunctions.Pass(
      this,
      'ProcessWorkflowJobTemplate2160pPass'
    );

    this.processWorkflowJobTemplate720p = new stepfunctions.Pass(
      this,
      'ProcessWorkflowJobTemplate720pPass'
    );

    this.publishWorkflowComplete = new stepfunctions.Pass(
      this,
      'PublishWorkflowCompletePass'
    );
  }
}
