module "λ_media_convert_sqs_publish" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.14.0"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-media-convert-sqs-publish"
  description                        = "Publish MediaConvert status updates to SQS"
  handler                            = "index.handler"
  runtime                            = "nodejs14.x"
  s3_bucket                          = module.s3_λ_source.s3_bucket_id
  s3_key                             = aws_s3_bucket_object.λ_sqs_publish.key
  s3_object_version                  = aws_s3_bucket_object.λ_sqs_publish.version_id
  tags                               = local.tags
  timeout                            = 120
  tracing_config_mode                = "Active"

  cloudwatch_event_rules = {
    media_convert = {
      event_pattern = jsonencode({
        source = ["aws.mediaconvert"]
        detail = {
          userMetadata = {
            workflow : [local.project]
          }
        }
      })
    }
  }

  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      ErrorHandler : module.λ_error_handler.arn
      SqsQueue : "https://sqs.eu-central-1.amazonaws.com/806599846381/livingdocs-transcoding-events-production-queue.fifo"
    }
  }
}

data "aws_iam_policy_document" "λ_media_convert_sqs_publish" {
  statement {
    actions   = ["sqs:SendMessage"]
    resources = ["arn:aws:sqs:eu-central-1:806599846381:livingdocs-transcoding-events-production-queue.fifo"]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [module.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_media_convert_sqs_publish" {
  name   = "${local.project}-media-convert-sqs-publish-${data.aws_region.current.name}"
  policy = data.aws_iam_policy_document.λ_media_convert_sqs_publish.json
}

resource "aws_iam_role_policy_attachment" "λ_media_convert_sqs_publish" {
  role       = module.λ_media_convert_sqs_publish.role_name
  policy_arn = aws_iam_policy.λ_media_convert_sqs_publish.arn
}