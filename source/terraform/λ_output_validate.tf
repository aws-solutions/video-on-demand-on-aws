locals {
  output_validate_function_name = "output-validate"
  output_validate_s3_key        = "${local.s3_prefix}/${local.output_validate_function_name}/package.zip"
  output_validate_package       = "${local.lambda_package_dir}/${local.output_validate_s3_key}"
}

module "λ_output_validate" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.15.1"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-${local.output_validate_function_name}"
  description                        = "Parses MediaConvert job output"
  handler                            = "index.handler"
  ignore_external_function_updates   = true
  publish                            = true
  runtime                            = "nodejs14.x"
  s3_bucket                          = aws_s3_bucket.s3_λ_source.bucket
  s3_key                             = local.output_validate_s3_key
  s3_object_version                  = aws_s3_bucket_object.λ_output_validate.version_id
  tags                               = local.tags
  timeout                            = 120
  tracing_config_mode                = "Active"

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      Destination : module.s3_destination.s3_bucket_id
      DestinationRestricted : module.s3_destination_for_restricted_videos.s3_bucket_id
      DynamoDBTable : aws_dynamodb_table.this.name
      CloudFront : "videos.t-online.de"
      CloudFrontRestricted : "de.videos.t-online.de"
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
      EndPoint : data.external.mediaconvert_endpoint.result.Url
    }
  }
}

data "aws_iam_policy_document" "λ_output_validate" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${module.s3_source.s3_bucket_arn}/*"]
  }
  statement {
    actions = ["s3:ListBucket"]
    resources = [
      module.s3_destination.s3_bucket_arn,
      module.s3_destination_for_restricted_videos.s3_bucket_arn
    ]
  }
  statement {
    actions   = ["dynamodb:GetItem"]
    resources = [aws_dynamodb_table.this.arn]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_alias.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_output_validate" {
  description = "${local.project} output validation"
  name        = "${local.project}-${local.output_validate_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_output_validate.json
}

resource "aws_iam_role_policy_attachment" "λ_output_validate" {
  role       = module.λ_output_validate.role_name
  policy_arn = aws_iam_policy.λ_output_validate.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_output_validate" {
  bucket = aws_s3_bucket.s3_λ_source.bucket
  key    = local.output_validate_s3_key
  source = fileexists(local.output_validate_package) ? local.output_validate_package : null
  etag   = fileexists(local.output_validate_package) ? filemd5(local.output_validate_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id]
  }
}

resource "aws_lambda_alias" "λ_output_validate" {
  function_name    = module.λ_output_validate.function_name
  function_version = module.λ_output_validate.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_output_validate_deployment" {
  source  = "moritzzimmer/lambda/aws//modules/deployment"
  version = "5.15.1"

  alias_name                        = aws_lambda_alias.λ_output_validate.name
  codestar_notifications_target_arn = data.aws_sns_topic.codestar_notifications.arn
  function_name                     = module.λ_output_validate.function_name
  s3_bucket                         = aws_s3_bucket.s3_λ_source.bucket
  s3_key                            = local.output_validate_s3_key
}
