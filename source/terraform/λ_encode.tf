locals {
  encode_function_name = "encode"
  encode_s3_key        = "${local.s3_prefix}/${local.encode_function_name}/package.zip"
  encode_package       = "${local.lambda_package_dir}/${local.encode_s3_key}"
}

data "external" "mediaconvert_endpoint" {
  program = ["aws", "--query", "Endpoints[0]", "mediaconvert", "describe-endpoints", "--region", var.region]
}

module "λ_encode" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws"
  version = "6.10.0"

  cloudwatch_logs_retention_in_days = local.cloudwatch_logs_retention_in_days
  function_name                     = "${local.project}-${local.encode_function_name}"
  description                       = "Creates a MediaConvert encode job"
  handler                           = "index.handler"
  ignore_external_function_updates  = true
  publish                           = true
  runtime                           = "nodejs14.x"
  s3_bucket                         = module.s3_λ_source.s3_bucket_id
  s3_key                            = local.encode_s3_key
  s3_object_version                 = aws_s3_bucket_object.λ_encode.version_id
  timeout                           = 120

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      MediaConvertRole : aws_iam_role.media_transcode_role.arn
      EndPoint : data.external.mediaconvert_endpoint.result.Url
      Destination : module.s3_destination.s3_bucket_id
      DestinationRestricted : module.s3_destination_for_restricted_videos.s3_bucket_id
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
    }
  }

  cloudwatch_log_subscription_filters = {
    opensearch = {
      destination_arn = data.aws_lambda_function.log_streaming.arn
    }
  }
}

data "aws_iam_policy_document" "λ_encode" {
  statement {
    actions   = ["mediaconvert:CreateJob", "mediaconvert:GetJobTemplate", "mediaconvert:TagResource"]
    resources = ["arn:aws:mediaconvert:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"]
  }
  statement {
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.media_transcode_role.arn]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_alias.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_encode" {
  description = "${local.project} input validation"
  name        = "${local.project}-${local.encode_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_encode.json
}

resource "aws_iam_role_policy_attachment" "λ_encode" {
  role       = module.λ_encode.role_name
  policy_arn = aws_iam_policy.λ_encode.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_encode" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = local.encode_s3_key
  source = fileexists(local.encode_package) ? local.encode_package : null
  etag   = fileexists(local.encode_package) ? filemd5(local.encode_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id, tags_all]
  }
}

resource "aws_lambda_alias" "λ_encode" {
  function_name    = module.λ_encode.function_name
  function_version = module.λ_encode.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_encode_deployment" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws//modules/deployment"
  version = "6.10.0"

  alias_name                                  = aws_lambda_alias.λ_encode.name
  codebuild_cloudwatch_logs_retention_in_days = local.codebuild_cloudwatch_logs_retention_in_days
  codestar_notifications_target_arn           = data.aws_sns_topic.codestar_notifications.arn
  function_name                               = module.λ_encode.function_name
  codepipeline_artifact_store_bucket          = module.s3_λ_source.s3_bucket_id
  s3_bucket                                   = module.s3_λ_source.s3_bucket_id
  s3_key                                      = local.encode_s3_key
}
