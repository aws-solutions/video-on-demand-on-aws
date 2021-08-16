resource "aws_s3_bucket_object" "λ_input_validate" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = "input-validate/package.zip"
  source = "${local.lambda_package_dir}/input-validate.zip"
  etag   = filemd5("${local.lambda_package_dir}/input-validate.zip")
}

module "λ_input_validate" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.14.0"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-input-validation"
  description                        = "Creates a unique identifier (GUID) and executes the Ingest StateMachine"
  handler                            = "index.handler"
  runtime                            = "nodejs14.x"
  s3_bucket                          = module.s3_λ_source.s3_bucket_id
  s3_key                             = aws_s3_bucket_object.λ_input_validate.key
  s3_object_version                  = aws_s3_bucket_object.λ_input_validate.version_id
  tags                               = local.tags
  timeout                            = 120
  tracing_config_mode                = "Active"

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      ErrorHandler : module.λ_error_handler.arn
      WorkflowName : local.project
      Source : module.s3_source.s3_bucket_id
      Destination : module.s3_destination.s3_bucket_id
      AcceleratedTranscoding : var.accelerated_transcoding
      FrameCapture : var.frame_capture
      ArchiveSource : var.glacier
      MediaConvert_Template_1080p : "${local.project}_Ott_1080p_Avc_Aac_16x9_qvbr_no_preset"
      MediaConvert_Template_720p : "${local.project}_Ott_720p_Avc_Aac_16x9_qvbr_no_preset"
      CloudFront : "d1q9f0uk9ts7gc.cloudfront.net"
      EnableMediaPackage : false
      InputRotate : "DEGREE_0"
      EnableSns : true
      EnableSqs : true
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
    resources = [module.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_input_validate" {
  description = "${local.project} input validation"
  name        = "${local.project}-input-validate-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_input_validate.json
}

resource "aws_iam_role_policy_attachment" "λ_input_validate" {
  role       = module.λ_input_validate.role_name
  policy_arn = aws_iam_policy.λ_input_validate.arn
}