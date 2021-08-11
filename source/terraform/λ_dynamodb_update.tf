resource "aws_s3_bucket_object" "λ_dynamodb_update" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = "dynamo/package.zip"
  source = "${local.lambda_package_dir}/dynamo.zip"
  etag   = filemd5("${local.lambda_package_dir}/dynamo.zip")
}

module "λ_dynamodb_update" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.14.0"

  cloudwatch_lambda_insights_enabled = true
  function_name                      = "${local.project}-dynamodb-update"
  description                        = "Updates DynamoDB with event data"
  handler                            = "index.handler"
  runtime                            = "nodejs14.x"
  s3_bucket                          = module.s3_λ_source.s3_bucket_id
  s3_key                             = aws_s3_bucket_object.λ_dynamodb_update.key
  s3_object_version                  = aws_s3_bucket_object.λ_dynamodb_update.version_id
  tags                               = local.tags
  timeout                            = 120
  tracing_config_mode                = "Active"

  environment = {
    variables = {
      DynamoDBTable : aws_dynamodb_table.this.name
      ErrorHandler : module.λ_error_handler.arn
    }
  }

}

data "aws_iam_policy_document" "λ_dynamodb_update" {
  statement {
    actions   = ["dynamodb:UpdateItem"]
    resources = [aws_dynamodb_table.this.arn]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [module.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_dynamodb_update" {
  description = "${local.project} input validation"
  name        = "${local.project}-dynamodb-update-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_dynamodb_update.json
}

resource "aws_iam_role_policy_attachment" "λ_dynamodb_update" {
  role       = module.λ_dynamodb_update.role_name
  policy_arn = aws_iam_policy.λ_dynamodb_update.arn
}