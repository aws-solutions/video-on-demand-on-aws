import { Construct } from 'constructs';
import { aws_stepfunctions as stepfunctions } from 'aws-cdk-lib';

export interface StepFunctionsProps {
  stackName: string;
  stackStage: string;
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
        stateMachineName: `${props.stackStage}${props.stackName}IngestWorkflowStateMachine`,
        definition: this.ingestWorkflowChain,
      }
    );

    this.processWorkflowStateMachine = new stepfunctions.StateMachine(
      this,
      'ProcessWorkflowStateMachine',
      {
        stateMachineName: `${props.stackStage}${props.stackName}ProcessWorkflowStateMachine`,
        definition: this.ingestWorkflowChain,
      }
    );

    this.publishWorkflowStateMachine = new stepfunctions.StateMachine(
      this,
      'PublishWorkflowStateMachine',
      {
        stateMachineName: `${props.stackStage}${props.stackName}PublishWorkflowStateMachine`,
        definition: this.ingestWorkflowChain,
      }
    );
  }
}
