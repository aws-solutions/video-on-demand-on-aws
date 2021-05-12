import { Construct } from 'constructs';
import { aws_lambda as lambda, Duration } from 'aws-cdk-lib';

export interface LambdaFunctionsProps {
  stackName: string;
  stackStage: string;
}

export class LambdaFunctions extends Construct {
  public readonly customResourceFunction: lambda.Function;
  public readonly dynamoDbUpdateFunction: lambda.Function;
  public readonly inputValidateFunction: lambda.Function;
  public readonly mediaInfoFunction: lambda.Function;
  public readonly profilerFunction: lambda.Function;
  public readonly stepFunctionsFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaFunctionsProps) {
    super(scope, id);

    this.customResourceFunction = new lambda.Function(
      this,
      'CustomResourceFunction',
      {
        functionName: `${props.stackStage}${props.stackName}CustomResourceLambdaFunction`,
        description: 'Used to deploy resources not supported by CloudFormation',
        handler: 'index.handler',
        code: new lambda.AssetCode('../../source/custom-resource'),
        runtime: lambda.Runtime.NODEJS_12_X,
        timeout: Duration.seconds(180),
        environment: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
      }
    );

    this.dynamoDbUpdateFunction = new lambda.Function(
      this,
      'DynamoDbUpdateFunction',
      {
        functionName: `${props.stackStage}${props.stackName}DynamoDbUpdateLambdaFunction`,
        description: 'Updates DynamoDB with event data',
        handler: 'index.handler',
        code: new lambda.AssetCode('../../source/dynamo'),
        runtime: lambda.Runtime.NODEJS_12_X,
        timeout: Duration.seconds(120),
        environment: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
      }
    );

    this.inputValidateFunction = new lambda.Function(
      this,
      'InputValidateFunction',
      {
        functionName: `${props.stackStage}${props.stackName}InputValidateLambdaFunction`,
        description: 'Validates the input given to the workflow',
        handler: 'index.handler',
        code: new lambda.AssetCode('../../source/input-validate'),
        runtime: lambda.Runtime.NODEJS_12_X,
        timeout: Duration.seconds(120),
        environment: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
      }
    );

    this.mediaInfoFunction = new lambda.Function(this, 'MediaInfoFunction', {
      functionName: `${props.stackStage}${props.stackName}MediaInfoLambdaFunction`,
      description: 'Runs MediaInfo on a pre-signed S3 URL',
      handler: 'lambda_function.lambda_handler',
      code: new lambda.AssetCode('../../source/mediainfo'),
      runtime: lambda.Runtime.PYTHON_3_7,
      timeout: Duration.seconds(120),
    });

    this.profilerFunction = new lambda.Function(this, 'ProfilerFunction', {
      functionName: `${props.stackStage}${props.stackName}ProfilerFunction`,
      description: 'Sets an EncodeProfile based on mediainfo output',
      handler: 'index.handler',
      code: new lambda.AssetCode('../../source/profiler'),
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: Duration.seconds(120),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
    });

    this.stepFunctionsFunction = new lambda.Function(
      this,
      'StepFunctionsFunction',
      {
        functionName: `${props.stackStage}${props.stackName}StepFunctionsLambdaFunction`,
        description:
          'Creates a unique identifier (GUID) and executes the Ingest StateMachine',
        code: new lambda.AssetCode('../../source/step-functions'),
        handler: 'index.handler',
        runtime: lambda.Runtime.NODEJS_12_X,
        environment: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
      }
    );
  }
}
