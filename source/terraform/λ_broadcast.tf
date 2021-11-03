locals {
  broadcast_function_name = "broadcast"
  broadcast_s3_key        = "${local.s3_prefix}/${local.broadcast_function_name}/package.zip"
  broadcast_package       = "${local.lambda_package_dir}/${local.broadcast_s3_key}"
}

data "aws_sns_topic" "secondary" {
  name = "cms-updates-secondary"
}

module "λ_broadcast" {
  source  = "moritzzimmer/lambda/aws"
  version = "6.0.0"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-${local.broadcast_function_name}"
  description                        = "update articles that depend on the video being processed."
  handler                            = "index.handler"
  ignore_external_function_updates   = true
  publish                            = true
  runtime                            = "nodejs14.x"
  s3_bucket                          = aws_s3_bucket.s3_λ_source.bucket
  s3_key                             = local.broadcast_s3_key
  s3_object_version                  = aws_s3_bucket_object.λ_broadcast.version_id
  timeout                            = 120
  tracing_config_mode                = "Active"

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      SnsTopic : data.aws_sns_topic.secondary.arn
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
    }
  }

  ssm = {
    parameter_names = [
      "/external/livingdocs/cms.token",
      "/external/livingdocs/cms.base-url"
    ]
  }

  cloudwatch_log_subscription_filters = {
    elasticsearch = {
      destination_arn = data.aws_lambda_function.log_streaming.arn
    }
  }
}

data "aws_iam_policy_document" "λ_broadcast" {
  statement {
    actions   = ["sns:Publish"]
    resources = [data.aws_sns_topic.secondary.arn]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["true"]
    }
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_alias.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_broadcast" {
  description = "${local.project} broadcast"
  name        = "${local.project}-${local.broadcast_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_broadcast.json
}

resource "aws_iam_role_policy_attachment" "λ_broadcast" {
  role       = module.λ_broadcast.role_name
  policy_arn = aws_iam_policy.λ_broadcast.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_broadcast" {
  bucket = aws_s3_bucket.s3_λ_source.bucket
  key    = local.broadcast_s3_key
  source = fileexists(local.broadcast_package) ? local.broadcast_package : null
  etag   = fileexists(local.broadcast_package) ? filemd5(local.broadcast_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id, tags_all]
  }
}

resource "aws_lambda_alias" "λ_broadcast" {
  function_name    = module.λ_broadcast.function_name
  function_version = module.λ_broadcast.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_broadcast_deployment" {
  source  = "moritzzimmer/lambda/aws//modules/deployment"
  version = "6.0.0"

  alias_name                         = aws_lambda_alias.λ_broadcast.name
  codestar_notifications_target_arn  = data.aws_sns_topic.codestar_notifications.arn
  function_name                      = module.λ_broadcast.function_name
  codepipeline_artifact_store_bucket = aws_s3_bucket.s3_λ_source.bucket
  s3_bucket                          = aws_s3_bucket.s3_λ_source.bucket
  s3_key                             = local.broadcast_s3_key
}
