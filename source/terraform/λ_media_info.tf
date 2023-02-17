locals {
  media_info_function_name = "mediainfo"
  media_info_s3_key        = "${local.s3_prefix}/${local.media_info_function_name}/package.zip"
  media_info_package       = "${local.lambda_package_dir}/${local.media_info_s3_key}"
}

module "λ_media_info" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws"
  version = "6.10.0"

  cloudwatch_logs_retention_in_days = local.cloudwatch_logs_retention_in_days
  function_name                     = "${local.project}-${local.media_info_function_name}"
  description                       = "Creates a unique identifier (GUID) and executes the Ingest StateMachine"
  handler                           = "lambda_function.lambda_handler"
  ignore_external_function_updates  = true
  publish                           = true
  runtime                           = "python3.8"
  s3_bucket                         = module.s3_λ_source.s3_bucket_id
  s3_key                            = local.media_info_s3_key
  s3_object_version                 = aws_s3_bucket_object.λ_media_info.version_id
  timeout                           = 120

  environment = {
    variables = {
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
    }
  }

  cloudwatch_log_subscription_filters = {
    opensearch = {
      destination_arn = data.aws_lambda_function.log_streaming.arn
    }
  }
}

data "aws_iam_policy_document" "λ_media_info" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${module.s3_source.s3_bucket_arn}/*"]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_alias.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_media_info" {
  description = "${local.project} input validation"
  name        = "${local.project}-${local.media_info_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_media_info.json
}

resource "aws_iam_role_policy_attachment" "λ_media_info" {
  role       = module.λ_media_info.role_name
  policy_arn = aws_iam_policy.λ_media_info.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_media_info" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = local.media_info_s3_key
  source = fileexists(local.media_info_package) ? local.media_info_package : null
  etag   = fileexists(local.media_info_package) ? filemd5(local.media_info_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id, tags_all]
  }
}

resource "aws_lambda_alias" "λ_media_info" {
  function_name    = module.λ_media_info.function_name
  function_version = module.λ_media_info.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_media_info_deployment" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws//modules/deployment"
  version = "6.10.0"

  alias_name                                  = aws_lambda_alias.λ_media_info.name
  codebuild_cloudwatch_logs_retention_in_days = local.codebuild_cloudwatch_logs_retention_in_days
  codestar_notifications_target_arn           = data.aws_sns_topic.codestar_notifications.arn
  function_name                               = module.λ_media_info.function_name
  codepipeline_artifact_store_bucket          = module.s3_λ_source.s3_bucket_id
  s3_bucket                                   = module.s3_λ_source.s3_bucket_id
  s3_key                                      = local.media_info_s3_key
}
