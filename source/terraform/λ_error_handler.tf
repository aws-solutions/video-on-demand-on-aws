resource "aws_s3_bucket_object" "λ_error_handler" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = "error-handler/package.zip"
  source = "${local.lambda_package_dir}/error-handler.zip"
  etag   = filesha256("${local.lambda_package_dir}/error-handler.zip")
}

module "λ_error_handler" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.12.2"

  function_name = "${local.project}-error-handler"
  description   = "Captures and processes workflow errors"
  handler       = "index.handler"

  s3_bucket         = module.s3_λ_source.s3_bucket_id
  s3_key            = aws_s3_bucket_object.λ_error_handler.key
  s3_object_version = aws_s3_bucket_object.λ_error_handler.version_id

  runtime = "nodejs14.x"
  timeout = 120
  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      DynamoDBTable : aws_dynamodb_table.this.arn
      SnsTopic : aws_sns_topic.notifications.arn
    }
  }

  tags = local.tags
}

data "aws_iam_policy_document" "λ_error_handler" {
  statement {
    actions   = ["sns:Publishe"]
    resources = [aws_sns_topic.notifications.id]
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
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [module.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_error_handler" {
  description = "${local.project} error handler"
  name        = "${local.project}-error-handler-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_error_handler.json
}

resource "aws_iam_role_policy_attachment" "λ_error_handler" {
  role       = module.λ_error_handler.role_name
  policy_arn = aws_iam_policy.λ_error_handler.arn
}