locals {
  step_functions_function_name = "step-functions"
  step_functions_s3_key        = "${local.s3_prefix}/${local.step_functions_function_name}/package.zip"
}

module "λ_step_functions" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.15.1"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-${local.step_functions_function_name}"
  description                        = "Creates a unique identifier (GUID) and executes the Ingest StateMachine"
  handler                            = "index.handler"
  ignore_external_function_updates   = true
  publish                            = true
  runtime                            = "nodejs14.x"
  s3_bucket                          = aws_s3_bucket.s3_λ_source.bucket
  s3_key                             = local.step_functions_s3_key
  s3_object_version                  = aws_s3_bucket_object.λ_step_functions.version_id
  tags                               = local.tags
  timeout                            = 120
  tracing_config_mode                = "Active"

  cloudwatch_event_rules = {
    media_convert_completed = {
      description = "MediaConvert Completed event rule"
      name        = "${local.project}-EncodeComplete"

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

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      IngestWorkflow : "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-ingest"
      ProcessWorkflow : "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-process"
      PublishWorkflow : "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-publish"
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
    }
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
      "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-ingest:*"
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
  bucket = aws_s3_bucket.s3_λ_source.bucket
  key    = local.step_functions_s3_key
  source = "${local.lambda_package_dir}/${local.step_functions_function_name}.zip"
  etag   = filemd5("${local.lambda_package_dir}/${local.step_functions_function_name}.zip")

  lifecycle {
    ignore_changes = [etag, version_id]
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
  source  = "moritzzimmer/lambda/aws//modules/deployment"
  version = "5.15.1"

  alias_name                        = aws_lambda_alias.λ_step_functions.name
  codestar_notifications_target_arn = data.aws_sns_topic.codestar_notifications.arn
  function_name                     = module.λ_step_functions.function_name
  s3_bucket                         = aws_s3_bucket.s3_λ_source.bucket
  s3_key                            = local.step_functions_s3_key
}
