locals {
  sqs_publish_function_name = "sqs-publish"
  sqs_publish_s3_key        = "${local.s3_prefix}/${local.sqs_publish_function_name}/package.zip"
}

module "λ_sqs_publish" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.15.1"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-${local.sqs_publish_function_name}"
  description                        = "Publish the workflow results to an SQS queue"
  handler                            = "index.handler"
  ignore_external_function_updates   = true
  publish                            = true
  runtime                            = "nodejs14.x"
  s3_bucket                          = aws_s3_bucket.s3_λ_source.bucket
  s3_key                             = local.sqs_publish_s3_key
  s3_object_version                  = aws_s3_bucket_object.λ_sqs_publish.version_id
  tags                               = local.tags
  timeout                            = 120
  tracing_config_mode                = "Active"

  cloudwatch_event_rules = {
    media_convert = {
      event_pattern = jsonencode({
        source = ["aws.mediaconvert"]
        detail = {
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
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
      SqsQueue : "https://sqs.eu-central-1.amazonaws.com/806599846381/livingdocs-transcoding-events-production-queue.fifo"
    }
  }
}

data "aws_iam_policy_document" "λ_sqs_publish" {
  statement {
    actions   = ["sqs:SendMessage"]
    resources = ["arn:aws:sqs:eu-central-1:806599846381:livingdocs-transcoding-events-production-queue.fifo"]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_alias.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_sqs_publish" {
  description = "${local.project} input validation"
  name        = "${local.project}-${local.sqs_publish_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_sqs_publish.json
}

resource "aws_iam_role_policy_attachment" "λ_sqs_publish" {
  role       = module.λ_sqs_publish.role_name
  policy_arn = aws_iam_policy.λ_sqs_publish.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_sqs_publish" {
  bucket = aws_s3_bucket.s3_λ_source.bucket
  key    = local.sqs_publish_s3_key
  source = "${local.lambda_package_dir}/${local.sqs_publish_function_name}.zip"
  etag   = filemd5("${local.lambda_package_dir}/${local.sqs_publish_function_name}.zip")

  lifecycle {
    ignore_changes = [etag, version_id]
  }
}

resource "aws_lambda_alias" "λ_sqs_publish" {
  function_name    = module.λ_sqs_publish.function_name
  function_version = module.λ_sqs_publish.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_sqs_publish_deployment" {
  source  = "moritzzimmer/lambda/aws//modules/deployment"
  version = "5.15.1"

  alias_name                        = aws_lambda_alias.λ_sqs_publish.name
  codestar_notifications_target_arn = data.aws_sns_topic.codestar_notifications.arn
  function_name                     = module.λ_sqs_publish.function_name
  s3_bucket                         = aws_s3_bucket.s3_λ_source.bucket
  s3_key                            = local.sqs_publish_s3_key
}
