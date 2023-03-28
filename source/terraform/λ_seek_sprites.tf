locals {
  seek_sprites_function_name = "seek-sprites"
  seek_sprites_s3_key        = "${local.s3_prefix}/${local.seek_sprites_function_name}/package.zip"
  seek_sprites_package       = "${local.lambda_package_dir}/${local.seek_sprites_s3_key}"
}

module "λ_seek_sprites" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws"
  version = "6.11.0"

  function_name                    = "${local.project}-${local.seek_sprites_function_name}"
  description                      = "Updates tags on source files to enable Glacier"
  handler                          = "lambda_function.lambda_handler"
  ignore_external_function_updates = true
  publish                          = true
  runtime                          = "python3.8"
  s3_bucket                        = module.s3_λ_source.s3_bucket_id
  s3_key                           = local.seek_sprites_s3_key
  s3_object_version                = aws_s3_bucket_object.λ_seek_sprites.version_id
  timeout                          = 120
  memory_size                      = 512

  cloudwatch_logs_enabled           = false
  cloudwatch_logs_retention_in_days = 0
  layers = [
    "arn:aws:lambda:eu-west-1:053041861227:layer:CustomLoggingExtensionOpenSearch-Amd64:10",
    "arn:aws:lambda:eu-west-1:770693421928:layer:Klayers-p38-pillow:1",
    "arn:aws:lambda:eu-west-1:770693421928:layer:Klayers-p38-numpy:11"
  ]

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
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

data "aws_iam_policy_document" "λ_seek_sprites" {
  statement {
    sid     = "GetThumbnails"
    actions = ["s3:GetObject", "s3:ListBucket"]
    resources = [
      module.s3_destination.s3_bucket_arn,
      "${module.s3_destination.s3_bucket_arn}/*",
      module.s3_destination_for_restricted_videos.s3_bucket_arn,
      "${module.s3_destination_for_restricted_videos.s3_bucket_arn}/*"
    ]
  }

  statement {
    sid     = "AddSprites"
    actions = ["s3:PutObject*"]
    resources = [
      "${module.s3_destination.s3_bucket_arn}/*",
      "${module.s3_destination_for_restricted_videos.s3_bucket_arn}/*"
    ]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_alias.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_seek_sprites" {
  description = "${local.project} input validation"
  name        = "${local.project}-${local.seek_sprites_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_seek_sprites.json
}

resource "aws_iam_role_policy_attachment" "λ_seek_sprites" {
  role       = module.λ_seek_sprites.role_name
  policy_arn = aws_iam_policy.λ_seek_sprites.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_seek_sprites" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = local.seek_sprites_s3_key
  source = fileexists(local.seek_sprites_package) ? local.seek_sprites_package : null
  etag   = fileexists(local.seek_sprites_package) ? filemd5(local.seek_sprites_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id, tags_all]
  }
}

resource "aws_lambda_alias" "λ_seek_sprites" {
  function_name    = module.λ_seek_sprites.function_name
  function_version = module.λ_seek_sprites.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_seek_sprites_deployment" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws//modules/deployment"
  version = "6.11.0"

  alias_name                                  = aws_lambda_alias.λ_seek_sprites.name
  codebuild_cloudwatch_logs_retention_in_days = local.codebuild_cloudwatch_logs_retention_in_days
  codestar_notifications_target_arn           = data.aws_sns_topic.codestar_notifications.arn
  function_name                               = module.λ_seek_sprites.function_name
  codepipeline_artifact_store_bucket          = module.s3_λ_source.s3_bucket_id
  s3_bucket                                   = module.s3_λ_source.s3_bucket_id
  s3_key                                      = local.seek_sprites_s3_key
}

resource "opensearch_role" "λ_seek_sprites" {
  role_name           = "${local.project}-${local.seek_sprites_function_name}"
  description         = "Write access for ${local.project}-${local.seek_sprites_function_name} lambda"
  cluster_permissions = ["indices:data/write/bulk"]

  index_permissions {
    index_patterns  = ["${local.project}-${local.seek_sprites_function_name}-lambda-*"]
    allowed_actions = ["write", "create_index"]
  }
}

resource "opensearch_roles_mapping" "λ_seek_sprites" {
  role_name     = opensearch_role.λ_seek_sprites.role_name
  backend_roles = [module.λ_seek_sprites.role_arn]
}
