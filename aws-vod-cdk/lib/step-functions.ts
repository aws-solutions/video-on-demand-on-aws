import { Construct } from 'constructs';
import { aws_stepfunctions as stepfunctions } from 'aws-cdk-lib';
import { StepFunctionsChoices } from './step-functions-choices';
import { StepFunctionsPasses } from './step-functions-passes';
import { StepFunctionsTasks } from './step-functions-tasks';
import { Condition } from 'aws-cdk-lib/lib/aws-stepfunctions';
import { IamRoles } from './iam-roles';

export interface StepFunctionsProps {
  iamRoles: IamRoles;
  stackName: string;
  stepFunctionsChoices: StepFunctionsChoices;
  stepFunctionsPasses: StepFunctionsPasses;
  stepFunctionsTasks: StepFunctionsTasks;
}

export class StepFunctions extends Construct {
  // Ingest Workflow StateMachine, Chain, and States
  public readonly ingestWorkflowStateMachine: stepfunctions.StateMachine;
  public readonly ingestWorkflowChain: stepfunctions.Chain;

  // Process Workflow StateMachine, Chain, and States
  public readonly processWorkflowStateMachine: stepfunctions.StateMachine;
  public readonly processWorkflowChain: stepfunctions.Chain;

  // Publish Workflow StateMachine, Chain, and States
  public readonly publishWorkflowStateMachine: stepfunctions.StateMachine;
  public readonly publishWorkflowChain: stepfunctions.Chain;

  constructor(scope: Construct, id: string, props: StepFunctionsProps) {
    super(scope, id);

    this.ingestWorkflowStateMachine = new stepfunctions.StateMachine(
      this,
      'IngestWorkflowStateMachine',
      {
        stateMachineName: `${props.stackName}-IngestWorkflowStateMachine`,
        definition: this.ingestWorkflowChain,
        role: props.iamRoles.stepFunctionsService,
      }
    );

    this.ingestWorkflowChain =
      props.stepFunctionsTasks.ingestWorkflowInputValidate
        .next(props.stepFunctionsTasks.ingestWorkflowMediaInfo)
        .next(props.stepFunctionsTasks.ingestWorkflowDynamoDbUpdate)
        .next(
          props.stepFunctionsChoices.ingestWorkflowSnsChoice.when(
            Condition.booleanEquals('$.enableSns', true),
            props.stepFunctionsTasks.ingestWorkflowSnsNotifications
          )
        )
        .next(props.stepFunctionsTasks.ingestWorkflowProcessExecute);

    this.processWorkflowStateMachine = new stepfunctions.StateMachine(
      this,
      'ProcessWorkflowStateMachine',
      {
        stateMachineName: `${props.stackName}-ProcessWorkflowStateMachine`,
        definition: this.processWorkflowChain,
        role: props.iamRoles.stepFunctionsService,
      }
    );

    this.processWorkflowChain = props.stepFunctionsTasks.processWorkflowProfiler
      .next(
        props.stepFunctionsChoices.processWorkflowEncodingProfileCheck
          .when(
            Condition.booleanEquals('$.isCustomTemplate', true),
            props.stepFunctionsPasses.processWorkflowCustomJobTemplate
          )
          .when(
            Condition.numberEquals('$.encodingProfile', 2160),
            props.stepFunctionsPasses.processWorkflowJobTemplate2160p
          )
          .when(
            Condition.numberEquals('$.encodingProfile', 1080),
            props.stepFunctionsPasses.processWorkflowJobTemplate1080p
          )
          .when(
            Condition.numberEquals('$.encodingProfile', 720),
            props.stepFunctionsPasses.processWorkflowJobTemplate720p
          )
      )
      .next(
        props.stepFunctionsChoices.processWorkflowAcceleratedTranscodingCheck
          .when(
            Condition.stringEquals('acceleratedTranscoding', 'ENABLED'),
            props.stepFunctionsPasses
              .processWorkflowAcceleratedTranscodingEnabled
          )
          .when(
            Condition.stringEquals('acceleratedTranscoding', 'PREFERRED'),
            props.stepFunctionsPasses
              .processWorkflowAcceleratedTranscodingPreferred
          )
          .when(
            Condition.stringEquals('acceleratedTranscoding', 'DISABLED'),
            props.stepFunctionsPasses
              .processWorkflowAcceleratedTranscodingDisabled
          )
      )
      .next(
        props.stepFunctionsChoices.processWorkflowFrameCaptureCheck
          .when(
            Condition.booleanEquals('$.frameCapture', true),
            props.stepFunctionsPasses.processWorkflowFrameCaptureOn
          )
          .otherwise(props.stepFunctionsPasses.processWorkflowFrameCaptureOff)
      )
      .next(props.stepFunctionsTasks.processWorkflowEncodeJobSubmit)
      .next(props.stepFunctionsTasks.processWorkflowDynamoDbUpdate);

    this.publishWorkflowStateMachine = new stepfunctions.StateMachine(
      this,
      'PublishWorkflowStateMachine',
      {
        stateMachineName: `${props.stackName}-PublishWorkflowStateMachine`,
        definition: this.publishWorkflowChain,
        role: props.iamRoles.stepFunctionsService,
      }
    );

    this.publishWorkflowChain =
      props.stepFunctionsTasks.publishWorkflowValidateEncodingOutput
        .next(
          props.stepFunctionsChoices.publishWorkflowArchiveSource
            .when(
              Condition.stringEquals('$.archiveSource', 'GLACIER'),
              props.stepFunctionsTasks.publishWorkflowArchive
            )
            .when(
              Condition.stringEquals('$.archiveSource', 'DEEP_ARCHIVE'),
              props.stepFunctionsTasks.publishWorkflowDeepArchive
            )
        )
        .next(
          props.stepFunctionsChoices.publishWorkflowMediaPackage.when(
            Condition.booleanEquals('$.enableMediaPackage', true),
            props.stepFunctionsTasks.publishWorkflowMediaPackageAssets
          )
        )
        .next(props.stepFunctionsTasks.publishWorkflowDynamoDbUpdate)
        .next(
          props.stepFunctionsChoices.publishWorkflowSqs.when(
            Condition.booleanEquals('$.enableSqs', true),
            props.stepFunctionsTasks.publishWorkflowSqsSendMessage
          )
        )
        .next(
          props.stepFunctionsChoices.publishWorkflowSns.when(
            Condition.booleanEquals('$.enableSns', true),
            props.stepFunctionsTasks.publishWorkflowSnsNotification
          )
        )
        .next(props.stepFunctionsPasses.publishWorkflowComplete);
  }
}
