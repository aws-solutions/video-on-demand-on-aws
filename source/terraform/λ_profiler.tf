resource "aws_s3_bucket_object" "λ_profiler" {
  bucket = module.s3_λ_source.s3_bucket_id
  key = "profiler/package.zip"
  source = "${local.lambda_package_dir}/profiler.zip"
  etag = filesha256("${local.lambda_package_dir}/profiler.zip")
}

module "λ_profiler" {
  source = "moritzzimmer/lambda/aws"
  version = "5.12.2"

  function_name = "${local.project}-profiler"
  description = "Sets an EncodeProfile based on mediainfo output"
  handler = "index.handler"

  s3_bucket = module.s3_λ_source.s3_bucket_id
  s3_key = aws_s3_bucket_object.λ_profiler.key
  s3_object_version = aws_s3_bucket_object.λ_profiler.version_id

  runtime = "nodejs14.x"
  timeout = 120
  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
      DynamoDBTable: aws_dynamodb_table.this.name
      ErrorHandler: module.λ_error_handler.arn
    }
  }

  tags = local.tags
}

data "aws_iam_policy_document" "λ_profiler" {
  statement {
    actions = ["dynamodb:GetItem"]
    resources = [aws_dynamodb_table.this.arn]
  }
  statement {
    actions = ["lambda:InvokeFunction"]
    resources = [module.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_profiler" {
  description = "${local.project} input validation"
  name = "${local.project}-profiler-${data.aws_region.current.name}"
  policy = data.aws_iam_policy_document.λ_profiler.json
}

resource "aws_iam_role_policy_attachment" "λ_profiler" {
  role = module.λ_profiler.role_name
  policy_arn = aws_iam_policy.λ_profiler.arn
}