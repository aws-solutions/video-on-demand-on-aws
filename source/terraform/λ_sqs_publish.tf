resource "aws_s3_bucket_object" "λ_sqs_publish" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = "sqs-publish/package.zip"
  source = "${local.lambda_package_dir}/sqs-publish.zip"
  etag   = filemd5("${local.lambda_package_dir}/sqs-publish.zip")
}

module "λ_sqs_publish" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.14.0"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-sqs-publish"
  description                        = "Publish the workflow results to an SQS queue"
  handler                            = "index.handler"
  runtime                            = "nodejs14.x"
  s3_bucket                          = module.s3_λ_source.s3_bucket_id
  s3_key                             = aws_s3_bucket_object.λ_sqs_publish.key
  s3_object_version                  = aws_s3_bucket_object.λ_sqs_publish.version_id
  tags                               = local.tags
  timeout                            = 120
  tracing_config_mode                = "Active"

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      ErrorHandler : module.λ_error_handler.arn
      SqsQueue : aws_sqs_queue.notifications.url
    }
  }
}

data "aws_iam_policy_document" "λ_sqs_publish" {
  statement {
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.notifications.arn]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["true"]
    }
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [module.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_sqs_publish" {
  description = "${local.project} input validation"
  name        = "${local.project}-sqs-publish-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_sqs_publish.json
}

resource "aws_iam_role_policy_attachment" "λ_sqs_publish" {
  role       = module.λ_sqs_publish.role_name
  policy_arn = aws_iam_policy.λ_sqs_publish.arn
}