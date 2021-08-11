resource "aws_s3_bucket_object" "λ_media_info" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = "mediainfo/package.zip"
  source = "${local.lambda_package_dir}/mediainfo.zip"
  etag   = filemd5("${local.lambda_package_dir}/mediainfo.zip")
}

module "λ_media_info" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.12.2"

  function_name = "${local.project}-media-info"
  description   = "Creates a unique identifier (GUID) and executes the Ingest StateMachine"
  handler       = "lambda_function.lambda_handler"

  s3_bucket         = module.s3_λ_source.s3_bucket_id
  s3_key            = aws_s3_bucket_object.λ_media_info.key
  s3_object_version = aws_s3_bucket_object.λ_media_info.version_id

  runtime = "python3.7"
  timeout = 120
  environment = {
    variables = {
      ErrorHandler : module.λ_error_handler.arn
    }
  }

  tags = local.tags
}

data "aws_iam_policy_document" "λ_media_info" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${module.s3_source.s3_bucket_arn}/*"]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [module.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_media_info" {
  description = "${local.project} input validation"
  name        = "${local.project}-media-info-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_media_info.json
}

resource "aws_iam_role_policy_attachment" "λ_media_info" {
  role       = module.λ_media_info.role_name
  policy_arn = aws_iam_policy.λ_media_info.arn
}