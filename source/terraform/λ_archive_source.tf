resource "aws_s3_bucket_object" "λ_archive_source" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = "archive-source/package.zip"
  source = "${local.lambda_package_dir}/archive-source.zip"
  etag   = filemd5("${local.lambda_package_dir}/archive-source.zip")
}

module "λ_archive_source" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.14.0"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-archive_source"
  description                        = "Updates tags on source files to enable Glacier"
  handler                            = "index.handler"
  runtime                            = "nodejs14.x"
  s3_bucket                          = module.s3_λ_source.s3_bucket_id
  s3_key                             = aws_s3_bucket_object.λ_archive_source.key
  s3_object_version                  = aws_s3_bucket_object.λ_archive_source.version_id
  tags                               = local.tags
  timeout                            = 120
  tracing_config_mode                = "Active"

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      ErrorHandler : module.λ_error_handler.arn
    }
  }
}

data "aws_iam_policy_document" "λ_archive_source" {
  statement {
    actions   = ["s3:PutObjectTagging"]
    resources = ["${module.s3_source.s3_bucket_arn}/*"]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [module.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_archive_source" {
  description = "${local.project} input validation"
  name        = "${local.project}-archive_source-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_archive_source.json
}

resource "aws_iam_role_policy_attachment" "λ_archive_source" {
  role       = module.λ_archive_source.role_name
  policy_arn = aws_iam_policy.λ_archive_source.arn
}