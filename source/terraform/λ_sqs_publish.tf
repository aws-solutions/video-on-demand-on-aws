locals {
  sqs_publish_function_name = "sqs-publish"
  sqs_publish_s3_key        = "${local.s3_prefix}/${local.sqs_publish_function_name}/package.zip"
  sqs_publish_package       = "${local.lambda_package_dir}/${local.sqs_publish_s3_key}"
}

module "λ_sqs_publish" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws"
  version = "6.11.0"

  function_name                    = "${local.project}-${local.sqs_publish_function_name}"
  description                      = "Publish the workflow results to an SQS queue"
  handler                          = "index.handler"
  ignore_external_function_updates = true
  publish                          = true
  runtime                          = "nodejs14.x"
  s3_bucket                        = module.s3_λ_source.s3_bucket_id
  s3_key                           = local.sqs_publish_s3_key
  s3_object_version                = aws_s3_bucket_object.λ_sqs_publish.version_id
  timeout                          = 120

  cloudwatch_event_rules = {
    media_convert = {
      cloudwatch_event_target_arn = aws_lambda_alias.λ_sqs_publish.arn

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

  cloudwatch_logs_enabled           = false
  cloudwatch_logs_retention_in_days = 0
  layers = [
    "arn:aws:lambda:eu-west-1:053041861227:layer:CustomLoggingExtensionOpenSearch-Amd64:9"
  ]

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
      SqsQueue : "https://sqs.eu-central-1.amazonaws.com/806599846381/livingdocs-transcoding-events-production-queue.fifo"
      LOG_EXT_OPEN_SEARCH_URL = "https://logs.stroeer.engineering"
    }
  }

  vpc_config = {
    security_group_ids = [
      data.aws_security_group.vpc_endpoints.id,
      data.aws_security_group.all_outbound.id,
      data.aws_security_group.lambda.id
    ]
    subnet_ids = data.aws_subnets.selected.ids
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
  bucket = module.s3_λ_source.s3_bucket_id
  key    = local.sqs_publish_s3_key
  source = fileexists(local.sqs_publish_package) ? local.sqs_publish_package : null
  etag   = fileexists(local.sqs_publish_package) ? filemd5(local.sqs_publish_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id, tags_all]
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
  source  = "registry.terraform.io/moritzzimmer/lambda/aws//modules/deployment"
  version = "6.11.0"

  alias_name                                  = aws_lambda_alias.λ_sqs_publish.name
  codebuild_cloudwatch_logs_retention_in_days = local.codebuild_cloudwatch_logs_retention_in_days
  codestar_notifications_target_arn           = data.aws_sns_topic.codestar_notifications.arn
  function_name                               = module.λ_sqs_publish.function_name
  codepipeline_artifact_store_bucket          = module.s3_λ_source.s3_bucket_id
  s3_bucket                                   = module.s3_λ_source.s3_bucket_id
  s3_key                                      = local.sqs_publish_s3_key
}

resource "opensearch_role" "λ_sqs_publish" {
  role_name           = "${local.project}-${local.sqs_publish_function_name}"
  description         = "Write access for ${local.project}-${local.sqs_publish_function_name} lambda"
  cluster_permissions = ["indices:data/write/bulk"]

  index_permissions {
    index_patterns  = ["${local.project}-${local.sqs_publish_function_name}-lambda-*"]
    allowed_actions = ["write", "create_index"]
  }
}

resource "opensearch_roles_mapping" "λ_sqs_publish" {
  role_name     = opensearch_role.λ_sqs_publish.role_name
  backend_roles = [module.λ_sqs_publish.role_arn]
}
