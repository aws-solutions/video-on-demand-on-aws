import { Stack } from 'aws-cdk-lib';

const convertToBool = (value: string | boolean | Number | null | undefined) => {
  if (value === undefined || !value) {
    return null;
  }
  switch (value) {
    case true:
    case 'true':
    case 1:
    case '1':
    case 'on':
    case 'yes':
      return true;
    default:
      return false;
  }
};

export class ContextVariables {
  public readonly acceleratedTranscoding: string;
  public readonly adminEmail: string;
  public readonly cloudFrontDomain: string;
  public readonly enableMediaPackage: boolean;
  public readonly enableSns: boolean;
  public readonly enableSqs: boolean;
  public readonly frameCapture: boolean;
  public readonly glacier: string;
  public readonly hostedZoneId: string;
  public readonly prependDomainWithStackStage: boolean;
  public readonly sendAnonymousMetrics: boolean;
  public readonly workflowTrigger: string;

  constructor(stack: Stack) {
    this.acceleratedTranscoding =
      stack.node.tryGetContext('acceleratedTranscoding') ?? 'PREFERRED';

    if (this.acceleratedTranscoding === undefined) {
      throw new Error(
        `The 'acceleratedTranscoding' context variable is required.`
      );
    }

    if (
      this.acceleratedTranscoding &&
      !['DISABLED', 'ENABLED', 'PREFERRED'].includes(
        this.acceleratedTranscoding
      )
    ) {
      throw new Error(
        `The 'acceleratedTranscoding' context variable must be one of 'DISABLED', 'ENABLED', or 'PREFERRED'; found value was '${this.acceleratedTranscoding}'.`
      );
    }

    this.adminEmail = stack.node.tryGetContext('adminEmail');

    if (this.adminEmail === undefined) {
      throw new Error(`The 'adminEmail' context variable is required.`);
    }

    const adminEmailValidation = this.adminEmail.match(
      /^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$/g
    );

    if (adminEmailValidation && adminEmailValidation.length !== 1) {
      throw new Error(
        `The 'adminEmail' context variable must be a valid email address and must contain only one email; found value was '${this.adminEmail}'.`
      );
    }

    this.prependDomainWithStackStage =
      stack.node.tryGetContext('prependDomainWithStackStage') ?? false;

    this.cloudFrontDomain =
      stack.node.tryGetContext('cloudFrontDomain') !== undefined
        ? !this.prependDomainWithStackStage &&
          stack.node.tryGetContext('stackStage') !== undefined
          ? stack.node.tryGetContext('cloudFrontDomain')
          : `${stack.node
              .tryGetContext('stackStage')
              .toLowerCase()}.${stack.node.tryGetContext('cloudFrontDomain')}`
        : undefined;

    this.enableMediaPackage =
      convertToBool(stack.node.tryGetContext('enableMediaPackage')) ?? false;

    this.enableSns =
      convertToBool(stack.node.tryGetContext('enableSns')) ?? true;

    this.enableSqs =
      convertToBool(stack.node.tryGetContext('enableSqs')) ?? true;

    this.frameCapture =
      convertToBool(stack.node.tryGetContext('frameCapture')) ?? false;

    this.glacier = stack.node.tryGetContext('glacier') ?? 'DISABLED';

    if (
      this.glacier &&
      !['DEEP_ARCHIVE', 'DISABLED', 'GLACIER'].includes(this.glacier)
    ) {
      throw new Error(
        `The 'glacier' context variable must be one of 'DEEP_ARCHIVE', 'DISABLED', or 'GLACIER'; found value was '${this.glacier}'.`
      );
    }

    this.hostedZoneId = stack.node.tryGetContext('hostedZoneId');

    this.sendAnonymousMetrics =
      convertToBool(stack.node.tryGetContext('sendAnonymousMetrics')) ?? false;

    this.workflowTrigger =
      stack.node.tryGetContext('workflowTrigger') ?? 'VideoFile';

    if (
      this.workflowTrigger &&
      !['VideoFile', 'MetadataFile'].includes(this.workflowTrigger)
    ) {
      throw new Error(
        `The 'workflowTrigger' context variable must either be 'VideoFile' or 'MetadataFile'; found value was '${this.workflowTrigger}'.`
      );
    }
  }
}
