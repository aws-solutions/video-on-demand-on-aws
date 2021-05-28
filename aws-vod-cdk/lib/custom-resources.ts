import { Construct } from 'constructs';
import { CustomResource } from 'aws-cdk-lib';
import { LambdaFunctions } from './lambda-functions';
import { S3Buckets } from './s3-buckets';
import { CloudFronts } from './cloudfronts';

export interface CustomResourcesProps {
  cloudFronts: CloudFronts;
  enableMediaPackage: boolean;
  frameCapture: boolean;
  glacier: string;
  lambdaFunctions: LambdaFunctions;
  s3Buckets: S3Buckets;
  sendAnonymousMetrics: boolean;
  stackName: string;
  workflowTrigger: string;
}

export class CustomResources extends Construct {
  public readonly anonymousMetrics: CustomResource | undefined;
  public readonly mediaConvertEndPoint: CustomResource;
  public readonly mediaConvertTemplates: CustomResource;
  public readonly mediaPackageVod: CustomResource;
  public readonly s3Config: CustomResource;
  public readonly uuid: CustomResource | undefined;

  constructor(scope: Construct, id: string, props: CustomResourcesProps) {
    super(scope, id);

    this.anonymousMetrics =
      props.sendAnonymousMetrics && this.uuid !== undefined
        ? new CustomResource(this, 'AnonymousMetrics', {
            resourceType: 'Custom::LoadLambda',
            serviceToken: props.lambdaFunctions.customResource.functionArn,
            properties: [
              { SolutionId: 'SO0021' },
              { UUID: this.uuid.getAtt('UUID') },
              { Version: this.node.tryGetContext('version') ?? '1.0.0' },
              { Transcoder: 'MediaConvert' },
              { WorkflowTrigger: props.workflowTrigger },
              { Glacier: props.glacier },
              { FrameCapture: props.frameCapture },
              { Resource: 'AnonymousMetrics' },
              { EnableMediaPackage: props.enableMediaPackage },
            ],
          })
        : undefined;

    this.mediaConvertEndPoint = new CustomResource(
      this,
      'MediaConvertEndPoint',
      {
        resourceType: 'Custom::LoadLambda',
        serviceToken: props.lambdaFunctions.customResource.functionArn,
        properties: [{ Resource: 'EndPoint' }],
      }
    );

    this.mediaConvertTemplates = new CustomResource(
      this,
      'MediaConvertTemplates',
      {
        resourceType: 'Custom::LoadLambda',
        serviceToken: props.lambdaFunctions.customResource.functionArn,
        properties: [
          { Resource: 'MediaConvertTemplates' },
          { StackName: props.stackName },
          { EndPoint: this.mediaConvertEndPoint.getAtt('EndpointUrl') },
          { EnableMediaPackage: props.enableMediaPackage },
          { EnableNewTemplates: true },
        ],
      }
    );

    this.mediaPackageVod = new CustomResource(this, 'MediaPackageVod', {
      resourceType: 'Custom::LoadLambda',
      serviceToken: props.lambdaFunctions.customResource.functionArn,
      properties: [
        { Resource: 'MediaPackageVod' },
        { StackName: props.stackName },
        { GroupId: `${props.stackName}-packaging-group` },
        { PackagingConfigurations: 'HLS,DASH,MSS,CMAF' },
        { DistributionId: props.cloudFronts.distribution },
        { EnableMediaPackage: props.enableMediaPackage },
      ],
    });

    this.s3Config = new CustomResource(this, 'S3Config', {
      resourceType: 'Custom::S3',
      serviceToken: props.lambdaFunctions.customResource.functionArn,
      properties: [
        { Source: props.s3Buckets.source },
        { IngestArn: props.lambdaFunctions.stepFunctions.functionArn },
        { Resource: 'S3Notification' },
        { WorkflowTrigger: props.workflowTrigger },
      ],
    });

    this.uuid = props.sendAnonymousMetrics
      ? new CustomResource(this, 'UUID', {
          resourceType: 'Custom::UUID',
          serviceToken: props.lambdaFunctions.customResource.functionArn,
          properties: [{ Resource: 'UUID' }],
        })
      : undefined;
  }
}
