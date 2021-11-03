const ignored_keys = new Set([
  // s3 events: INGEST
  "userIdentity", "requestParameters", "responseElements",
  "ownerIdentity", "arn", "s3SchemaVersion", "sequencer",
  // custom data: PROCESS
  "workflowTrigger", "workflowName", "frameCapture", "archiveSource",
  "jobTemplate_1080p", "jobTemplate_1080p_no_audio",
  "jobTemplate_720p", "jobTemplate_720p_no_audio",
  "inputRotate", "acceleratedTranscoding",
  "enableSns", "enableSqs",
  "srcMediainfo",
  // MediaConvert: PUBLISH
  "outputGroupDetails"

]);

function replacer(key, value) {
  // Filtering out binary image data
  if (ignored_keys.has(key)) {
    return undefined;
  }
  return value;
}

const sendMessage = (payload) => {
  const message = JSON.stringify(createMessage(payload), replacer);
  process.stdout.write(message + "\n");
};

function createMessage(payload) {
  return {
    "@version": 1,
    "@timestamp": new Date().toISOString(),
    level: payload.level.toUpperCase(),
    message: getMessage(payload),
    path: payload.event && payload.event.path,
    mdc: getMdc(payload),
    ...addIfExists("data", getData(payload)),
    ...addIfExists("exception", getExceptions(payload))
  };
}

function getMessage({args}) {
  if (args.length > 0 && isString(args[0])) {
    return args[0];
  }

  return "";
}

function getMdc({event}) {
  if (!event) {
    return {_warning: "No event was registered."};
  }

  const userMetadata = (event.detail && event.detail.userMetadata) || {};

  return {
    cmsId: event.cmsId || userMetadata.cmsId || "",
    guid: event.guid || userMetadata.guid || "",
    geoRestriction: event.geoRestriction || "",
    cmsCommandId: event.cmsCommandId || userMetadata.cmsCommandId,
    ttl: event.ttl || "",
    doPurge: event.doPurge || "",
    RequestId: process.env._X_AMZN_TRACE_ID || "",
    Function: process.env.AWS_LAMBDA_FUNCTION_NAME || "",
    Version: process.env.AWS_LAMBDA_FUNCTION_VERSION || "",
    InitType: process.env.AWS_LAMBDA_INITIALIZATION_TYPE || ""
  };
}

function addIfExists(attribute, list) {
  if (!list || list.length === 0) {
    return {};
  } else if (list.length === 1) {
    return {[attribute]: list[0]};
  } else {
    return {[attribute]: list};
  }
}

function getExceptions({args}) {
  return args
    .filter((arg) => isException(arg))
    .map(({message, stack}) => ({
      "exception_message": message,
      "stacktrace": stack
    }));
}

function getData({args}) {
  return (args.length > 0 && isString(args[0]) ? args.slice(1) : args).filter(
    (entity) => !isException(entity)
  );
}

function isException(e) {
  return e instanceof Error || (e && e.stack && e.message);
}

function isString(s) {
  return typeof s === "string";
}

module.exports = sendMessage;
