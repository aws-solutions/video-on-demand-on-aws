locals {
  purge_function_name = "purge"
  purge_s3_key        = "${local.s3_prefix}/${local.purge_function_name}/package.zip"
  purge_package       = "${local.lambda_package_dir}/${local.purge_s3_key}"
}

module "λ_purge" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws"
  version = "6.11.0"

  function_name                    = "${local.project}-${local.purge_function_name}"
  description                      = "Cleanup after items have been deleted."
  handler                          = "index.handler"
  ignore_external_function_updates = true
  publish                          = true
  runtime                          = "nodejs14.x"
  s3_bucket                        = module.s3_λ_source.s3_bucket_id
  s3_key                           = local.purge_s3_key
  s3_object_version                = aws_s3_bucket_object.λ_purge.version_id
  timeout                          = 120

  cloudwatch_logs_enabled           = false
  cloudwatch_logs_retention_in_days = 0
  layers = [
    "arn:aws:lambda:eu-west-1:053041861227:layer:CustomLoggingExtensionOpenSearch-Amd64:9"
  ]

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      Destination : module.s3_destination.s3_bucket_id
      DestinationRestricted : module.s3_destination_for_restricted_videos.s3_bucket_id
      DynamoDBTable : aws_dynamodb_table.this.name
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
      LOG_EXT_OPEN_SEARCH_URL = "https://logs.stroeer.engineering"
    }
  }

  vpc_config = {
    security_group_ids = [
      data.aws_security_group.vpc_endpoints.id,
      data.aws_security_group.lambda.id
    ]
    subnet_ids = data.aws_subnets.selected.ids
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
  source  = "registry.terraform.io/moritzzimmer/lambda/aws//modules/deployment"
  version = "6.11.0"

  alias_name                                  = aws_lambda_alias.λ_purge.name
  codebuild_cloudwatch_logs_retention_in_days = local.codebuild_cloudwatch_logs_retention_in_days
  codestar_notifications_target_arn           = data.aws_sns_topic.codestar_notifications.arn
  function_name                               = module.λ_purge.function_name
  codepipeline_artifact_store_bucket          = module.s3_λ_source.s3_bucket_id
  s3_bucket                                   = module.s3_λ_source.s3_bucket_id
  s3_key                                      = local.purge_s3_key
}

resource "opensearch_role" "λ_purge" {
  role_name           = "${local.project}-${local.purge_function_name}"
  description         = "Write access for ${local.project}-${local.purge_function_name} lambda"
  cluster_permissions = ["indices:data/write/bulk"]

  index_permissions {
    index_patterns  = ["${local.project}-${local.purge_function_name}-lambda-*"]
    allowed_actions = ["write", "create_index"]
  }
}

resource "opensearch_roles_mapping" "λ_purge" {
  role_name     = opensearch_role.λ_purge.role_name
  backend_roles = [module.λ_purge.role_arn]
}
