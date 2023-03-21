locals {
  error_handler_function_name = "error-handler"
  error_handler_s3_key        = "${local.s3_prefix}/${local.error_handler_function_name}/package.zip"
  error_handler_package       = "${local.lambda_package_dir}/${local.error_handler_s3_key}"
}

module "λ_error_handler" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws"
  version = "6.11.0"

  function_name                     = "${local.project}-${local.error_handler_function_name}"
  description                       = "Captures and processes workflow errors"
  handler                           = "index.handler"
  ignore_external_function_updates  = true
  publish                           = true
  runtime                           = "nodejs14.x"
  s3_bucket                         = module.s3_λ_source.s3_bucket_id
  s3_key                            = local.error_handler_s3_key
  s3_object_version                 = aws_s3_bucket_object.λ_error_handler.version_id
  timeout                           = 120

  cloudwatch_event_rules = {
    media_convert_errors = {
      cloudwatch_event_target_arn = aws_lambda_alias.λ_error_handler.arn
      name                        = "${local.project}-EncodeError"
      description                 = "MediaConvert Error event rule"

      event_pattern = jsonencode({
        source = ["aws.mediaconvert"]
        detail = {
          status = ["ERROR"],
          userMetadata = {
            workflow : [local.project]
          }
        }
      })
    }

    # https://docs.aws.amazon.com/step-functions/latest/dg/cw-events.html#cw-events-events
    step_functions = {
      cloudwatch_event_target_arn = aws_lambda_alias.λ_error_handler.arn
      name                        = "${local.project}-StepFunctionErrors"
      description                 = "StepFunctions Error event rule"

      event_pattern = jsonencode({
        source = ["aws.states"]
        detail = {
          status = ["ABORTED", "TIMED_OUT", "FAILED", "SUCCEEDED"]
          stateMachineArn = [
            aws_sfn_state_machine.ingest.arn,
            aws_sfn_state_machine.process.arn,
            aws_sfn_state_machine.publish.arn
          ]
        }
      })
    }
  }

  cloudwatch_logs_enabled = false
  layers = [
    "arn:aws:lambda:eu-west-1:053041861227:layer:CustomLoggingExtensionOpenSearch-Amd64:9"
  ]

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      DynamoDBTable : aws_dynamodb_table.this.name
      SnsTopic : data.aws_sns_topic.error_notifications.arn
      SlackHook : aws_ssm_parameter.slack_hook.value,
      GenieKey : data.aws_ssm_parameter.genie_key.value
    }
  }

  vpc_config = {
    security_group_ids = [
      data.aws_security_group.vpc_endpoints.id,
      data.aws_security_group.all_outbound.id,
      data.aws_security_group.lambda.id
    ]
    subnet_ids         = data.aws_subnets.selected.ids
  }

}

data "aws_iam_policy_document" "λ_error_handler" {
  statement {
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.notifications.id, data.aws_sns_topic.error_notifications.arn]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["true"]
    }
  }
  statement {
    actions   = ["dynamodb:UpdateItem"]
    resources = [aws_dynamodb_table.this.arn]
  }
}

resource "aws_iam_policy" "λ_error_handler" {
  description = "${local.project} error handler"
  name        = "${local.project}-${local.error_handler_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_error_handler.json
}

resource "aws_iam_role_policy_attachment" "λ_error_handler" {
  role       = module.λ_error_handler.role_name
  policy_arn = aws_iam_policy.λ_error_handler.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_error_handler" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = local.error_handler_s3_key
  source = fileexists(local.error_handler_package) ? local.error_handler_package : null
  etag   = fileexists(local.error_handler_package) ? filemd5(local.error_handler_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id, tags_all]
  }
}


resource "aws_lambda_alias" "λ_error_handler" {
  function_name    = module.λ_error_handler.function_name
  function_version = module.λ_error_handler.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_error_handler_deployment" {
  source  = "registry.terraform.io/moritzzimmer/lambda/aws//modules/deployment"
  version = "6.11.0"

  alias_name                                  = aws_lambda_alias.λ_error_handler.name
  codebuild_cloudwatch_logs_retention_in_days = local.codebuild_cloudwatch_logs_retention_in_days
  codestar_notifications_target_arn           = data.aws_sns_topic.codestar_notifications.arn
  function_name                               = module.λ_error_handler.function_name
  codepipeline_artifact_store_bucket          = module.s3_λ_source.s3_bucket_id
  s3_bucket                                   = module.s3_λ_source.s3_bucket_id
  s3_key                                      = local.error_handler_s3_key
}

resource "aws_ssm_parameter" "slack_hook" {
  name  = "/internal/buzzhub/slack_hook"
  type  = "SecureString"
  value = "changeMe"

  lifecycle {
    ignore_changes = [
      value
    ]
  }
}

data "aws_ssm_parameter" "genie_key" {
  name            = "/external/opsgenie/buzzhub.api.key"
  with_decryption = true
}

resource "opensearch_role" "λ_error_handler" {
  role_name           = "${local.project}-${local.error_handler_function_name}"
  description         = "Write access for ${local.project}-${local.error_handler_function_name} lambda"
  cluster_permissions = ["indices:data/write/bulk"]

  index_permissions {
    index_patterns  = ["${local.project}-${local.error_handler_function_name}-lambda-*"]
    allowed_actions = ["write", "create_index"]
  }
}

resource "opensearch_roles_mapping" "λ_error_handler" {
  role_name     = opensearch_role.λ_error_handler.role_name
  backend_roles = [module.λ_error_handler.role_arn]
}