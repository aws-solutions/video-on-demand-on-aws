locals {
  error_handler_function_name = "error-handler"
  error_handler_s3_key        = "${local.s3_prefix}/${local.error_handler_function_name}/package.zip"
  error_handler_package       = "${local.lambda_package_dir}/${local.error_handler_s3_key}"
}

module "λ_error_handler" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.15.1"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-${local.error_handler_function_name}"
  description                        = "Captures and processes workflow errors"
  handler                            = "index.handler"
  ignore_external_function_updates   = true
  publish                            = true
  runtime                            = "nodejs14.x"
  s3_bucket                          = aws_s3_bucket.s3_λ_source.bucket
  s3_key                             = local.error_handler_s3_key
  s3_object_version                  = aws_s3_bucket_object.λ_error_handler.version_id
  tags                               = local.tags
  timeout                            = 120
  tracing_config_mode                = "Active"

  cloudwatch_event_rules = {
    media_convert_errors = {
      cloudwatch_event_target_arn = aws_lambda_alias.λ_error_handler.arn
      name                        = "${local.project}-EncodeError"
      description                 = "MediaConvert Error event rule"

      event_pattern = jsonencode({
        source = ["aws.mediaconvert"]
        detail = {
          status = ["ERROR"],
          userMetadata = {
            workflow : [local.project]
          }
        }
      })
    }
  }

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      DynamoDBTable : aws_dynamodb_table.this.arn
      SnsTopic : aws_sns_topic.notifications.arn
    }
  }
}

data "aws_iam_policy_document" "λ_error_handler" {
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
    actions   = ["dynamodb:UpdateItem"]
    resources = [aws_dynamodb_table.this.arn]
  }
}

resource "aws_iam_policy" "λ_error_handler" {
  description = "${local.project} error handler"
  name        = "${local.project}-${local.error_handler_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_error_handler.json
}

resource "aws_iam_role_policy_attachment" "λ_error_handler" {
  role       = module.λ_error_handler.role_name
  policy_arn = aws_iam_policy.λ_error_handler.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_error_handler" {
  bucket = aws_s3_bucket.s3_λ_source.bucket
  key    = local.error_handler_s3_key
  source = fileexists(local.error_handler_package) ? local.error_handler_package : null
  etag   = fileexists(local.error_handler_package) ? filemd5(local.error_handler_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id]
  }
}


resource "aws_lambda_alias" "λ_error_handler" {
  function_name    = module.λ_error_handler.function_name
  function_version = module.λ_error_handler.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_error_handler_deployment" {
  source  = "moritzzimmer/lambda/aws//modules/deployment"
  version = "5.15.1"

  alias_name                        = aws_lambda_alias.λ_error_handler.name
  codestar_notifications_target_arn = data.aws_sns_topic.codestar_notifications.arn
  function_name                     = module.λ_error_handler.function_name
  s3_bucket                         = aws_s3_bucket.s3_λ_source.bucket
  s3_key                            = local.error_handler_s3_key
}
