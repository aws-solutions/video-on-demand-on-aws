locals {
  dynamodb_update_function_name = "dynamo"
  dynamodb_update_s3_key        = "${local.s3_prefix}/${local.dynamodb_update_function_name}/package.zip"
  dynamodb_update_package       = "${local.lambda_package_dir}/${local.dynamodb_update_s3_key}"
}

module "λ_dynamodb_update" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws"
  version = "6.10.0"

  cloudwatch_logs_retention_in_days = local.cloudwatch_logs_retention_in_days
  function_name                     = "${local.project}-${local.dynamodb_update_function_name}"
  description                       = "Updates DynamoDB with event data"
  handler                           = "index.handler"
  ignore_external_function_updates  = true
  publish                           = true
  runtime                           = "nodejs14.x"
  s3_bucket                         = module.s3_λ_source.s3_bucket_id
  s3_key                            = local.dynamodb_update_s3_key
  s3_object_version                 = aws_s3_bucket_object.λ_dynamodb_update.version_id
  timeout                           = 120

  environment = {
    variables = {
      DynamoDBTable : aws_dynamodb_table.this.name
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
    }
  }

  cloudwatch_log_subscription_filters = {
    opensearch = {
      destination_arn = data.aws_lambda_function.log_streaming.arn
    }
  }
}

data "aws_iam_policy_document" "λ_dynamodb_update" {
  statement {
    actions   = ["dynamodb:UpdateItem"]
    resources = [aws_dynamodb_table.this.arn]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_alias.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_dynamodb_update" {
  description = "${local.project} input validation"
  name        = "${local.project}-dynamodb-update-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_dynamodb_update.json
}

resource "aws_iam_role_policy_attachment" "λ_dynamodb_update" {
  role       = module.λ_dynamodb_update.role_name
  policy_arn = aws_iam_policy.λ_dynamodb_update.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_dynamodb_update" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = local.dynamodb_update_s3_key
  source = fileexists(local.dynamodb_update_package) ? local.dynamodb_update_package : null
  etag   = fileexists(local.dynamodb_update_package) ? filemd5(local.dynamodb_update_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id, tags_all]
  }
}

resource "aws_lambda_alias" "λ_dynamodb_update" {
  function_name    = module.λ_dynamodb_update.function_name
  function_version = module.λ_dynamodb_update.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_dynamodb_update_deployment" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws//modules/deployment"
  version = "6.10.0"

  alias_name                                  = aws_lambda_alias.λ_dynamodb_update.name
  codebuild_cloudwatch_logs_retention_in_days = local.codebuild_cloudwatch_logs_retention_in_days
  codestar_notifications_target_arn           = data.aws_sns_topic.codestar_notifications.arn
  function_name                               = module.λ_dynamodb_update.function_name
  codepipeline_artifact_store_bucket          = module.s3_λ_source.s3_bucket_id
  s3_bucket                                   = module.s3_λ_source.s3_bucket_id
  s3_key                                      = local.dynamodb_update_s3_key
}
