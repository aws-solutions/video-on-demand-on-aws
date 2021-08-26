locals {
  profiler_function_name = "profiler"
  profiler_s3_key        = "${local.s3_prefix}/${local.profiler_function_name}/package.zip"
}

module "λ_profiler" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.15.1"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-${local.profiler_function_name}"
  description                        = "Sets an EncodeProfile based on mediainfo output"
  handler                            = "index.handler"
  ignore_external_function_updates   = true
  publish                            = true
  runtime                            = "nodejs14.x"
  s3_bucket                          = aws_s3_bucket.s3_λ_source.bucket
  s3_key                             = local.profiler_s3_key
  s3_object_version                  = aws_s3_bucket_object.λ_profiler.version_id
  tags                               = local.tags
  timeout                            = 120
  tracing_config_mode                = "Active"

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      DynamoDBTable : aws_dynamodb_table.this.name
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
    }
  }
}

data "aws_iam_policy_document" "λ_profiler" {
  statement {
    actions   = ["dynamodb:GetItem"]
    resources = [aws_dynamodb_table.this.arn]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_alias.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_profiler" {
  description = "${local.project} input validation"
  name        = "${local.project}-${local.profiler_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_profiler.json
}

resource "aws_iam_role_policy_attachment" "λ_profiler" {
  role       = module.λ_profiler.role_name
  policy_arn = aws_iam_policy.λ_profiler.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_profiler" {
  bucket = aws_s3_bucket.s3_λ_source.bucket
  key    = local.profiler_s3_key
  source = "${local.lambda_package_dir}/${local.profiler_function_name}.zip"
  etag   = filemd5("${local.lambda_package_dir}/${local.profiler_function_name}.zip")

  lifecycle {
    ignore_changes = [etag, version_id]
  }
}

resource "aws_lambda_alias" "λ_profiler" {
  function_name    = module.λ_profiler.function_name
  function_version = module.λ_profiler.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_profiler_deployment" {
  source  = "moritzzimmer/lambda/aws//modules/deployment"
  version = "5.15.1"

  alias_name                        = aws_lambda_alias.λ_profiler.name
  codestar_notifications_target_arn = data.aws_sns_topic.codestar_notifications.arn
  function_name                     = module.λ_profiler.function_name
  s3_bucket                         = aws_s3_bucket.s3_λ_source.bucket
  s3_key                            = local.profiler_s3_key
}
