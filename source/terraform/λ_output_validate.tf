locals {
  output_validate_function_name = "output-validate"
  output_validate_s3_key        = "${local.s3_prefix}/${local.output_validate_function_name}/package.zip"
  output_validate_package       = "${local.lambda_package_dir}/${local.output_validate_s3_key}"
}

module "λ_output_validate" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws"
  version = "6.11.0"

  function_name                     = "${local.project}-${local.output_validate_function_name}"
  description                       = "Parses MediaConvert job output"
  handler                           = "index.handler"
  ignore_external_function_updates  = true
  publish                           = true
  runtime                           = "nodejs14.x"
  s3_bucket                         = module.s3_λ_source.s3_bucket_id
  s3_key                            = local.output_validate_s3_key
  s3_object_version                 = aws_s3_bucket_object.λ_output_validate.version_id
  timeout                           = 300

  cloudwatch_logs_enabled = false
  layers = [
    "arn:aws:lambda:eu-west-1:053041861227:layer:CustomLoggingExtensionOpenSearch-Amd64:9"
  ]

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
      LOG_EXT_OPEN_SEARCH_URL = "https://logs.stroeer.engineering"
    }
  }

  vpc_config = {
    security_group_ids = [
      data.aws_security_group.vpc_endpoints.id,
      data.aws_security_group.lambda.id
    ]
    subnet_ids         = data.aws_subnets.selected.ids
  }

}

data "aws_iam_policy_document" "λ_output_validate" {
  statement {
    actions = ["s3:GetObject"]
    resources = [
      "${module.s3_source.s3_bucket_arn}/*",
      "${module.s3_destination.s3_bucket_arn}/*",
      "${module.s3_destination_for_restricted_videos.s3_bucket_arn}/*"
    ]
  }
  statement {
    actions = ["s3:PutObject"]
    resources = [
      "${module.s3_destination.s3_bucket_arn}/*",
      "${module.s3_destination_for_restricted_videos.s3_bucket_arn}/*"
    ]
  }
  statement {
    actions = ["s3:ListBucket"]
    resources = [
      //      module.s3_source.s3_bucket_arn,
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
  bucket = module.s3_λ_source.s3_bucket_id
  key    = local.output_validate_s3_key
  source = fileexists(local.output_validate_package) ? local.output_validate_package : null
  etag   = fileexists(local.output_validate_package) ? filemd5(local.output_validate_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id, tags_all]
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
  source  = "registry.terraform.io/moritzzimmer/lambda/aws//modules/deployment"
  version = "6.11.0"

  alias_name                                  = aws_lambda_alias.λ_output_validate.name
  codebuild_cloudwatch_logs_retention_in_days = local.codebuild_cloudwatch_logs_retention_in_days
  codestar_notifications_target_arn           = data.aws_sns_topic.codestar_notifications.arn
  function_name                               = module.λ_output_validate.function_name
  codepipeline_artifact_store_bucket          = module.s3_λ_source.s3_bucket_id
  s3_bucket                                   = module.s3_λ_source.s3_bucket_id
  s3_key                                      = local.output_validate_s3_key
}

resource "opensearch_role" "λ_output_validate" {
  role_name           = "${local.project}-${local.output_validate_function_name}"
  description         = "Write access for ${local.project}-${local.output_validate_function_name} lambda"
  cluster_permissions = ["indices:data/write/bulk"]

  index_permissions {
    index_patterns  = ["${local.project}-${local.output_validate_function_name}-lambda-*"]
    allowed_actions = ["write", "create_index"]
  }
}

resource "opensearch_roles_mapping" "λ_output_validate" {
  role_name     = opensearch_role.λ_output_validate.role_name
  backend_roles = [module.λ_output_validate.role_arn]
}