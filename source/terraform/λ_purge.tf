locals {
  purge_function_name = "purge"
  purge_s3_key        = "${local.s3_prefix}/${local.purge_function_name}/package.zip"
  purge_package       = "${local.lambda_package_dir}/${local.purge_s3_key}"
}

module "λ_purge" {
  source  = "moritzzimmer/lambda/aws"
  version = "6.1.0"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-${local.purge_function_name}"
  description                        = "Cleanup after items have been deleted."
  handler                            = "index.handler"
  ignore_external_function_updates   = true
  publish                            = true
  runtime                            = "nodejs14.x"
  s3_bucket                          = module.s3_λ_source.s3_bucket_id
  s3_key                             = local.purge_s3_key
  s3_object_version                  = aws_s3_bucket_object.λ_purge.version_id
  timeout                            = 120
  tracing_config_mode                = "Active"

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      Destination : module.s3_destination.s3_bucket_id
      DestinationRestricted : module.s3_destination_for_restricted_videos.s3_bucket_id
      DynamoDBTable : aws_dynamodb_table.this.name
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
    }
  }

  cloudwatch_log_subscription_filters = {
    elasticsearch = {
      destination_arn = data.aws_lambda_function.log_streaming.arn
    }
  }
}

data "aws_iam_policy_document" "λ_purge" {
  statement {
    actions = ["s3:DeleteObject*"]
    resources = [
      "${module.s3_destination.s3_bucket_arn}/*",
      "${module.s3_destination_for_restricted_videos.s3_bucket_arn}/*"
    ]
  }
  statement {
    actions = ["s3:ListBucket"]
    resources = [
      module.s3_destination.s3_bucket_arn,
      module.s3_destination_for_restricted_videos.s3_bucket_arn
    ]
  }
  statement {
    actions   = ["dynamodb:DeleteItem"]
    resources = [aws_dynamodb_table.this.arn]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_alias.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_purge" {
  description = "${local.project} purge"
  name        = "${local.project}-${local.purge_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_purge.json
}

resource "aws_iam_role_policy_attachment" "λ_purge" {
  role       = module.λ_purge.role_name
  policy_arn = aws_iam_policy.λ_purge.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_purge" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = local.purge_s3_key
  source = fileexists(local.purge_package) ? local.purge_package : null
  etag   = fileexists(local.purge_package) ? filemd5(local.purge_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id, tags_all]
  }
}

resource "aws_lambda_alias" "λ_purge" {
  function_name    = module.λ_purge.function_name
  function_version = module.λ_purge.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_purge_deployment" {
  source  = "moritzzimmer/lambda/aws//modules/deployment"
  version = "6.0.0"

  alias_name                         = aws_lambda_alias.λ_purge.name
  codestar_notifications_target_arn  = data.aws_sns_topic.codestar_notifications.arn
  function_name                      = module.λ_purge.function_name
  codepipeline_artifact_store_bucket = module.s3_λ_source.s3_bucket_id
  s3_bucket                          = module.s3_λ_source.s3_bucket_id
  s3_key                             = local.purge_s3_key
}
