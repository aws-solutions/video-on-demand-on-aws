locals {
  archive_source_function_name = "archive-source"
  archive_source_s3_key        = "${local.s3_prefix}/${local.archive_source_function_name}/package.zip"
  archive_source_package       = "${local.lambda_package_dir}/${local.archive_source_s3_key}"
}

module "λ_archive_source" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.15.1"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-${local.archive_source_function_name}"
  description                        = "Updates tags on source files to enable Glacier"
  handler                            = "index.handler"
  ignore_external_function_updates   = true
  publish                            = true
  runtime                            = "nodejs14.x"
  s3_bucket                          = aws_s3_bucket.s3_λ_source.bucket
  s3_key                             = local.archive_source_s3_key
  s3_object_version                  = aws_s3_bucket_object.λ_archive_source.version_id
  tags                               = local.tags
  timeout                            = 120
  tracing_config_mode                = "Active"

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
    }
  }
}

data "aws_iam_policy_document" "λ_archive_source" {
  statement {
    actions   = ["s3:PutObjectTagging"]
    resources = ["${module.s3_source.s3_bucket_arn}/*"]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_alias.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_archive_source" {
  description = "${local.project} input validation"
  name        = "${local.project}-${local.archive_source_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_archive_source.json
}

resource "aws_iam_role_policy_attachment" "λ_archive_source" {
  role       = module.λ_archive_source.role_name
  policy_arn = aws_iam_policy.λ_archive_source.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_archive_source" {
  bucket = aws_s3_bucket.s3_λ_source.bucket
  key    = local.archive_source_s3_key
  source = fileexists(local.archive_source_package) ? local.archive_source_package : null
  etag   = fileexists(local.archive_source_package) ? filemd5(local.archive_source_package) : null

  lifecycle {
    ignore_changes = [etag, version_id]
  }
}

resource "aws_lambda_alias" "λ_archive_source" {
  function_name    = module.λ_archive_source.function_name
  function_version = module.λ_archive_source.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_archive_source_deployment" {
  source  = "moritzzimmer/lambda/aws//modules/deployment"
  version = "5.15.1"

  alias_name                        = aws_lambda_alias.λ_archive_source.name
  codestar_notifications_target_arn = data.aws_sns_topic.codestar_notifications.arn
  function_name                     = module.λ_archive_source.function_name
  s3_bucket                         = aws_s3_bucket.s3_λ_source.bucket
  s3_key                            = local.archive_source_s3_key
}
