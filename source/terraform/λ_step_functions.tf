locals {
  step_functions_function_name = "step-functions"
  step_functions_s3_key        = "${local.s3_prefix}/${local.step_functions_function_name}/package.zip"
  step_functions_package       = "${local.lambda_package_dir}/${local.step_functions_s3_key}"
}

module "λ_step_functions" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws"
  version = "6.11.0"

  function_name                    = "${local.project}-${local.step_functions_function_name}"
  description                      = "Creates a unique identifier (GUID) and executes the Ingest StateMachine"
  handler                          = "index.handler"
  ignore_external_function_updates = true
  publish                          = true
  runtime                          = "nodejs14.x"
  s3_bucket                        = module.s3_λ_source.s3_bucket_id
  s3_key                           = local.step_functions_s3_key
  s3_object_version                = aws_s3_bucket_object.λ_step_functions.version_id
  timeout                          = 120

  cloudwatch_event_rules = {
    media_convert_completed = {
      cloudwatch_event_target_arn = aws_lambda_alias.λ_step_functions.arn
      description                 = "MediaConvert Completed event rule"
      name                        = "${local.project}-EncodeComplete"

      event_pattern = jsonencode({
        source = ["aws.mediaconvert"]
        detail = {
          status = ["COMPLETE"],
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
      IngestWorkflow : "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-ingest"
      ProcessWorkflow : "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-process"
      PublishWorkflow : "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-publish"
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
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

data "aws_iam_policy_document" "λ_step_functions" {
  statement {
    actions = ["states:StartExecution"]
    resources = [
      "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-ingest",
      "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-process",
      "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-publish"
    ]
  }
  statement {
    actions = ["states:DescribeExecution"]
    resources = [
      "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:execution:${local.project}-ingest:*"
    ]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_alias.λ_error_handler.arn]
  }
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${module.s3_source.s3_bucket_arn}/*"]
  }
}

resource "aws_iam_policy" "λ_step_functions" {
  description = "${local.project} input validation"
  name        = "${local.project}-${local.step_functions_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_step_functions.json
}

resource "aws_iam_role_policy_attachment" "λ_step_functions" {
  role       = module.λ_step_functions.role_name
  policy_arn = aws_iam_policy.λ_step_functions.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_step_functions" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = local.step_functions_s3_key
  source = fileexists(local.step_functions_package) ? local.step_functions_package : null
  etag   = fileexists(local.step_functions_package) ? filemd5(local.step_functions_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id, tags_all]
  }
}

resource "aws_lambda_alias" "λ_step_functions" {
  function_name    = module.λ_step_functions.function_name
  function_version = module.λ_step_functions.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_step_functions_deployment" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws//modules/deployment"
  version = "6.11.0"

  alias_name                                  = aws_lambda_alias.λ_step_functions.name
  codebuild_cloudwatch_logs_retention_in_days = local.codebuild_cloudwatch_logs_retention_in_days
  codestar_notifications_target_arn           = data.aws_sns_topic.codestar_notifications.arn
  codepipeline_artifact_store_bucket          = module.s3_λ_source.s3_bucket_id
  s3_bucket                                   = module.s3_λ_source.s3_bucket_id
  s3_key                                      = local.step_functions_s3_key
  function_name                               = module.λ_step_functions.function_name
}

resource "opensearch_role" "λ_step_functions" {
  role_name           = "${local.project}-${local.step_functions_function_name}"
  description         = "Write access for ${local.project}-${local.step_functions_function_name} lambda"
  cluster_permissions = ["indices:data/write/bulk"]

  index_permissions {
    index_patterns  = ["${local.project}-${local.step_functions_function_name}-lambda-*"]
    allowed_actions = ["write", "create_index"]
  }
}

resource "opensearch_roles_mapping" "λ_step_functions" {
  role_name     = opensearch_role.λ_step_functions.role_name
  backend_roles = [module.λ_step_functions.role_arn]
}
