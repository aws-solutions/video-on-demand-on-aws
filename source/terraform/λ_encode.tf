resource "aws_s3_bucket_object" "λ_encode" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = "encode/package.zip"
  source = "${local.lambda_package_dir}/encode.zip"
  etag   = filesha256("${local.lambda_package_dir}/encode.zip")
}

data "external" "mediaconvert_endpoint" {
  program = ["aws", "--query", "Endpoints[0]", "mediaconvert", "describe-endpoints"]
}

module "λ_encode" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.12.2"

  function_name = "${local.project}-encode"
  description   = "Creates a MediaConvert encode job"
  handler       = "index.handler"

  s3_bucket         = module.s3_λ_source.s3_bucket_id
  s3_key            = aws_s3_bucket_object.λ_encode.key
  s3_object_version = aws_s3_bucket_object.λ_encode.version_id

  runtime = "nodejs14.x"
  timeout = 120
  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      MediaConvertRole : aws_iam_role.media_transcode_role.arn
      EndPoint : data.external.mediaconvert_endpoint.result.Url
      ErrorHandler : module.λ_error_handler.arn
    }
  }

  tags = local.tags
}

data "aws_iam_policy_document" "λ_encode" {
  statement {
    actions   = ["mediaconvert:CreateJob", "mediaconvert:GetJobTemplate"]
    resources = ["arn:aws:mediaconvert:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"]
  }
  statement {
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.media_transcode_role.arn]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [module.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_encode" {
  description = "${local.project} input validation"
  name        = "${local.project}-encode-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_encode.json
}

resource "aws_iam_role_policy_attachment" "λ_encode" {
  role       = module.λ_encode.role_name
  policy_arn = aws_iam_policy.λ_encode.arn
}