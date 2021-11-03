locals {
  input_validate_function_name = "input-validate"
  input_validate_s3_key        = "${local.s3_prefix}/${local.input_validate_function_name}/package.zip"
  input_validate_package       = "${local.lambda_package_dir}/${local.input_validate_s3_key}"
}

module "λ_input_validate" {
  source  = "moritzzimmer/lambda/aws"
  version = "6.0.0"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-${local.input_validate_function_name}"
  description                        = "Creates a unique identifier (GUID) and executes the Ingest StateMachine"
  handler                            = "index.handler"
  ignore_external_function_updates   = true
  publish                            = true
  runtime                            = "nodejs14.x"
  s3_bucket                          = aws_s3_bucket.s3_λ_source.bucket
  s3_key                             = local.input_validate_s3_key
  s3_object_version                  = aws_s3_bucket_object.λ_input_validate.version_id
  timeout                            = 120
  tracing_config_mode                = "Active"

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      ErrorHandler : aws_lambda_alias.λ_error_handler.arn
      WorkflowName : local.project
      AcceleratedTranscoding : var.accelerated_transcoding
      FrameCapture : var.frame_capture
      ArchiveSource : var.glacier
      MediaConvert_Template_1080p : "${local.project}_Ott_1080p_Avc_Aac_16x9_qvbr_no_preset"
      MediaConvert_Template_1080p_no_audio : "${local.project}_Ott_1080p_Avc_16x9_qvbr_no_preset"
      MediaConvert_Template_720p : "${local.project}_Ott_720p_Avc_Aac_16x9_qvbr_no_preset"
      MediaConvert_Template_720p_no_audio : "${local.project}_Ott_720p_Avc_16x9_qvbr_no_preset"
      EnableMediaPackage : false
      InputRotate : "DEGREE_0"
      EnableSns : true
      EnableSqs : true
    }
  }

  cloudwatch_log_subscription_filters = {
    elasticsearch = {
      destination_arn = data.aws_lambda_function.log_streaming.arn
    }
  }
}

data "aws_iam_policy_document" "λ_input_validate" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${module.s3_source.s3_bucket_arn}/*"]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_alias.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_input_validate" {
  description = "${local.project} input validation"
  name        = "${local.project}-${local.input_validate_function_name}-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_input_validate.json
}

resource "aws_iam_role_policy_attachment" "λ_input_validate" {
  role       = module.λ_input_validate.role_name
  policy_arn = aws_iam_policy.λ_input_validate.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Deployment resources
# ---------------------------------------------------------------------------------------------------------------------

// this resource is only used for the initial `terraform apply` - all further
// deployments are running on CodePipeline
resource "aws_s3_bucket_object" "λ_input_validate" {
  bucket = aws_s3_bucket.s3_λ_source.bucket
  key    = local.input_validate_s3_key
  source = fileexists(local.input_validate_package) ? local.input_validate_package : null
  etag   = fileexists(local.input_validate_package) ? filemd5(local.input_validate_package) : null

  lifecycle {
    ignore_changes = [etag, source, version_id, tags_all]
  }
}

resource "aws_lambda_alias" "λ_input_validate" {
  function_name    = module.λ_input_validate.function_name
  function_version = module.λ_input_validate.version
  name             = local.environment

  lifecycle {
    ignore_changes = [function_version]
  }
}

module "λ_input_validate_deployment" {
  source  = "moritzzimmer/lambda/aws//modules/deployment"
  version = "6.0.0"

  alias_name                        = aws_lambda_alias.λ_input_validate.name
  codestar_notifications_target_arn = data.aws_sns_topic.codestar_notifications.arn
  function_name                     = module.λ_input_validate.function_name
  codepipeline_artifact_store_bucket = aws_s3_bucket.s3_λ_source.bucket
  s3_bucket                         = aws_s3_bucket.s3_λ_source.bucket
  s3_key                            = local.input_validate_s3_key
}
