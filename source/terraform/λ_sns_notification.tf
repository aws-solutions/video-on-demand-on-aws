locals {
  sns_notification_function_name = "sns-notification"
  sns_notification_s3_key        = "${local.s3_prefix}/${local.sns_notification_function_name}/package.zip"
  sns_notification_package       = "${local.lambda_package_dir}/${local.sns_notification_s3_key}"
}

module "λ_sns_notification" {
  source  = "moritzzimmer/lambda/aws"
  version = "6.1.0"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-${local.sns_notification_function_name}"
  description                        = "Sends a notification when the encode job is completed"
  handler                            = "index.handler"
  ignore_external_function_updates   = true
  publish                            = true
  runtime                            = "nodejs14.x"
  s3_bucket                          = module.s3_λ_source.s3_bucket_id
  s3_key                             = local.sns_notification_s3_key
  s3_object_version                  = aws_s3_bucket_object.λ_sns_notification.version_id
  timeout                            = 120
  tracing_config_mode                = "Active"

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
      SnsTopic : aws_sns_topic.notifications.id
    }
  }

  cloudwatch_log_subscription_filters = {
    elasticsearch = {
      destination_arn = data.aws_lambda_function.log_streaming.arn
    }
  }
}

data "aws_iam_policy_document" "λ_sns_notification" {
  statement {
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.notifications.id]
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

resource "aws_iam_policy" "λ_sns_notification" {
  description = "${local.project} input validation"
  name        = "${local.project}-${local.sns_notification_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_sns_notification.json
}

resource "aws_iam_role_policy_attachment" "λ_sns_notification" {
  role       = module.λ_sns_notification.role_name
  policy_arn = aws_iam_policy.λ_sns_notification.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_sns_notification" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = local.sns_notification_s3_key
  source = fileexists(local.sns_notification_package) ? local.sns_notification_package : null
  etag   = fileexists(local.sns_notification_package) ? filemd5(local.sns_notification_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id, tags_all]
  }
}

resource "aws_lambda_alias" "λ_sns_notification" {
  function_name    = module.λ_sns_notification.function_name
  function_version = module.λ_sns_notification.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_sns_notification_deployment" {
  source  = "moritzzimmer/lambda/aws//modules/deployment"
  version = "6.0.0"

  alias_name                         = aws_lambda_alias.λ_sns_notification.name
  codestar_notifications_target_arn  = data.aws_sns_topic.codestar_notifications.arn
  function_name                      = module.λ_sns_notification.function_name
  codepipeline_artifact_store_bucket = module.s3_λ_source.s3_bucket_id
  s3_bucket                          = module.s3_λ_source.s3_bucket_id
  s3_key                             = local.sns_notification_s3_key
}
