import { Construct } from 'constructs';
import { aws_lambda as lambda, Duration, Stack } from 'aws-cdk-lib';

export interface LambdaFunctionsProps {
  acceleratedTranscoding: string;
  enableMediaPackage: boolean;
  enableSns: boolean;
  enableSqs: boolean;
  frameCapture: boolean;
  glacier: string;
  stackName: string;
}

export class LambdaFunctions extends Construct {
  public readonly archiveSource: lambda.Function;
  public readonly customResource: lambda.Function;
  public readonly dynamoDbUpdate: lambda.Function;
  public readonly errorHandler: lambda.Function;
  public readonly encode: lambda.Function;
  public readonly inputValidate: lambda.Function;
  public readonly mediaInfo: lambda.Function;
  public readonly mediaPackageAssets: lambda.Function;
  public readonly outputValidate: lambda.Function;
  public readonly profiler: lambda.Function;
  public readonly snsNotification: lambda.Function;
  public readonly sqsSendMessage: lambda.Function;
  public readonly stepFunctions: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaFunctionsProps) {
    super(scope, id);

    const partition = Stack.of(this).partition;

    const region = Stack.of(this).region;

    const account = Stack.of(this).account;

    this.archiveSource = new lambda.Function(this, 'ArchiveSourceFunction', {
      functionName: `${props.stackName}-ArchiveSourceLambdaFunction`,
      description: 'Updates tags on source files to enable Glacier',
      handler: 'index.handler',
      code: new lambda.AssetCode('../../source/archive-source'),
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: Duration.seconds(120),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
    });

    this.customResource = new lambda.Function(this, 'CustomResourceFunction', {
      functionName: `${props.stackName}-CustomResourceLambdaFunction`,
      description: 'Used to deploy resources not supported by CloudFormation',
      handler: 'index.handler',
      code: new lambda.AssetCode('../../source/custom-resource'),
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: Duration.seconds(180),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
    });

    this.dynamoDbUpdate = new lambda.Function(this, 'DynamoDbUpdateFunction', {
      functionName: `${props.stackName}-DynamoDbUpdateLambdaFunction`,
      description: 'Updates DynamoDB with event data',
      handler: 'index.handler',
      code: new lambda.AssetCode('../../source/dynamo'),
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: Duration.seconds(120),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
    });

    this.encode = new lambda.Function(this, 'EncodeFunction', {
      functionName: `${props.stackName}-EncodeLambdaFunction`,
      description: 'Creates a MediaConvert encode job',
      handler: 'index.handler',
      code: new lambda.AssetCode('../../source/encode'),
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: Duration.seconds(120),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
    });

    this.errorHandler = new lambda.Function(this, 'ErrorHandlerFunction', {
      functionName: `${props.stackName}-ErrorHandlerLambdaFunction`,
      description: 'Captures and processes workflow errors',
      handler: 'index.handler',
      code: new lambda.AssetCode('../../source/error-handler'),
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: Duration.seconds(120),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
    });

    this.inputValidate = new lambda.Function(this, 'InputValidateFunction', {
      functionName: `${props.stackName}-InputValidateLambdaFunction`,
      description: 'Validates the input given to the workflow',
      handler: 'index.handler',
      code: new lambda.AssetCode('../../source/input-validate'),
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: Duration.seconds(120),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        ErrorHandler: this.errorHandler.functionArn,
        WorkflowName: props.stackName,
        FrameCapture: props.frameCapture.toString(),
        ArchiveSource: props.glacier,
        EnableMediaPackage: props.enableMediaPackage.toString(),
        InputRotate: 'DEGREE_0',
        EnableSns: props.enableSns.toString(),
        EnableSqs: props.enableSqs.toString(),
        AcceleratedTranscoding: props.acceleratedTranscoding,
      },
    });

    if (props.enableMediaPackage) {
      this.inputValidate.addEnvironment(
        'MediaConvert_Template_2160p',
        `${props.stackName}_Ott_2160p_Avc_Aac_16x9_mvod_no_preset`
      );

      this.inputValidate.addEnvironment(
        'MediaConvert_Template_2160p',
        `${props.stackName}_Ott_2160p_Avc_Aac_16x9_qvbr_no_preset`
      );

      this.inputValidate.addEnvironment(
        'MediaConvert_Template_1080p',
        `${props.stackName}_Ott_1080p_Avc_Aac_16x9_mvod_no_preset`
      );

      this.inputValidate.addEnvironment(
        'MediaConvert_Template_1080p',
        `${props.stackName}_Ott_1080p_Avc_Aac_16x9_qvbr_no_preset`
      );

      this.inputValidate.addEnvironment(
        'MediaConvert_Template_720p',
        `${props.stackName}_Ott_720p_Avc_Aac_16x9_mvod_no_preset`
      );

      this.inputValidate.addEnvironment(
        'MediaConvert_Template_720p',
        `${props.stackName}_Ott_720p_Avc_Aac_16x9_qvbr_no_preset`
      );
    }

    this.mediaInfo = new lambda.Function(this, 'MediaInfoFunction', {
      functionName: `${props.stackName}-MediaInfoLambdaFunction`,
      description: 'Runs MediaInfo on a pre-signed S3 URL',
      handler: 'lambda_function.lambda_handler',
      code: new lambda.AssetCode('../../source/mediainfo'),
      runtime: lambda.Runtime.PYTHON_3_7,
      timeout: Duration.seconds(120),
    });

    this.mediaPackageAssets = new lambda.Function(
      this,
      'MediaPackageAssetsFunction',
      {
        functionName: `${props.stackName}-MediaPackageAssetsLambdaFunction`,
        description: 'Ingests an asset into MediaPackage-VOD',
        handler: 'index.handler',
        code: new lambda.AssetCode('../../source/media-package-assets'),
        runtime: lambda.Runtime.NODEJS_12_X,
        timeout: Duration.seconds(300),
        environment: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
      }
    );

    this.outputValidate = new lambda.Function(this, 'OutputValidateFunction', {
      functionName: `${props.stackName}-OutputValidateLambdaFunction`,
      description: 'Parses MediaConvert job output',
      handler: 'index.handler',
      code: new lambda.AssetCode('../../source/output-validate'),
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: Duration.seconds(120),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
    });

    this.profiler = new lambda.Function(this, 'ProfilerFunction', {
      functionName: `${props.stackName}-ProfilerLambdaFunction`,
      description: 'Sets an EncodeProfile based on mediainfo output',
      handler: 'index.handler',
      code: new lambda.AssetCode('../../source/profiler'),
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: Duration.seconds(120),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
    });

    this.snsNotification = new lambda.Function(
      this,
      'SnsNotificationFunction',
      {
        functionName: `${props.stackName}-SnsNotificationLambdaFunction`,
        description: 'Sends a notification when the encode job is completed',
        handler: 'index.handler',
        code: new lambda.AssetCode('../../source/sns-notification'),
        runtime: lambda.Runtime.NODEJS_12_X,
        timeout: Duration.seconds(120),
        environment: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
      }
    );

    this.sqsSendMessage = new lambda.Function(this, 'SqsSendMessageFunction', {
      functionName: `${props.stackName}-SqsSendMessageLambdaFunction`,
      description: 'Publish the workflow results to an SQS queue',
      handler: 'index.handler',
      code: new lambda.AssetCode('../../source/sqs-publish'),
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: Duration.seconds(120),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
    });

    this.stepFunctions = new lambda.Function(this, 'StepFunctionsFunction', {
      functionName: `${props.stackName}-StepFunctionsLambdaFunction`,
      description:
        'Creates a unique identifier (GUID) and executes the Ingest StateMachine',
      code: new lambda.AssetCode('../../source/step-functions'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        IngestWorkflow: `arn:${partition}:states:${region}:${account}:stateMachine:${props.stackName}-IngestWorkflowStateMachine`,
        ProcessWorkflow: `arn:${partition}:states:${region}:${account}:stateMachine:${props.stackName}-ProcessWorkflowStateMachine`,
        PublishWorkflow: `arn:${partition}:states:${region}:${account}:stateMachine:${props.stackName}-PublishWorkflowStateMachine`,
        ErrorHandler: this.errorHandler.functionArn,
      },
    });
  }
}
