resource "aws_s3_bucket_object" "λ_sns_notification" {
  bucket = module.s3_λ_source.s3_bucket_id
  key = "sns-notification/package.zip"
  source = "${local.lambda_package_dir}/sns-notification.zip"
  etag = filesha256("${local.lambda_package_dir}/sns-notification.zip")
}

module "λ_sns_notification" {
  source = "moritzzimmer/lambda/aws"
  version = "5.12.2"

  function_name = "${local.project}-sns-notification"
  description = "Sends a notification when the encode job is completed"
  handler = "index.handler"

  s3_bucket = module.s3_λ_source.s3_bucket_id
  s3_key = aws_s3_bucket_object.λ_sns_notification.key
  s3_object_version = aws_s3_bucket_object.λ_sns_notification.version_id

  runtime = "nodejs14.x"
  timeout = 120
  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
      ErrorHandler: module.λ_error_handler.arn
      SnsTopic: aws_sns_topic.notifications.id
    }
  }
}

data "aws_iam_policy_document" "λ_sns_notification" {
  statement {
    actions = ["sns:Publishe"]
    resources = [aws_sns_topic.notifications.id]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values = ["true"]
    }
  }
  statement {
    actions = ["lambda:InvokeFunction"]
    resources = [module.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_sns_notification" {
  description = "${local.project} input validation"
  name = "${local.project}-sns-notification-${data.aws_region.current.name}"
  policy = data.aws_iam_policy_document.λ_sns_notification.json
}

resource "aws_iam_role_policy_attachment" "λ_sns_notification" {
  role = module.λ_sns_notification.role_name
  policy_arn = aws_iam_policy.λ_sns_notification.arn
}