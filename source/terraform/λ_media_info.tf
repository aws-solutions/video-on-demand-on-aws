locals {
  media_info_function_name = "mediainfo"
  media_info_source_s3_key = "${local.s3_prefix}/${local.media_info_function_name}/package.zip"
}

module "λ_media_info" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.15.1"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-${local.media_info_function_name}"
  description                        = "Creates a unique identifier (GUID) and executes the Ingest StateMachine"
  handler                            = "lambda_function.lambda_handler"
  ignore_external_function_updates   = true
  publish                            = true
  runtime                            = "python3.7"
  s3_bucket                          = aws_s3_bucket.s3_λ_source.bucket
  s3_key                             = local.media_info_source_s3_key
  s3_object_version                  = aws_s3_bucket_object.λ_media_info.version_id
  timeout                            = 120
  tags                               = local.tags
  tracing_config_mode                = "Active"

  environment = {
    variables = {
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
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
  bucket = aws_s3_bucket.s3_λ_source.bucket
  key    = local.media_info_source_s3_key
  source = "${local.lambda_package_dir}/${local.media_info_source_s3_key}"
  etag   = filemd5("${local.lambda_package_dir}/${local.media_info_source_s3_key}")

  lifecycle {
    ignore_changes = [etag, version_id]
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
  source  = "moritzzimmer/lambda/aws//modules/deployment"
  version = "5.15.1"

  alias_name                        = aws_lambda_alias.λ_media_info.name
  codestar_notifications_target_arn = data.aws_sns_topic.codestar_notifications.arn
  function_name                     = module.λ_media_info.function_name
  s3_bucket                         = aws_s3_bucket.s3_λ_source.bucket
  s3_key                            = local.media_info_source_s3_key
}
