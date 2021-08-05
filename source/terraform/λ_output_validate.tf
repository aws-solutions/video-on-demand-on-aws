resource "aws_s3_bucket_object" "λ_output_validate" {
  bucket = module.s3_λ_source.s3_bucket_id
  key = "output-validate/package.zip"
  source = "${local.lambda_package_dir}/output-validate.zip"
  etag = filesha256("${local.lambda_package_dir}/output-validate.zip")
}

module "λ_output_validate" {
  source = "moritzzimmer/lambda/aws"
  version = "5.12.2"

  function_name = "${local.project}-output-validation"
  description = "Parses MediaConvert job output"
  handler = "index.handler"

  s3_bucket = module.s3_λ_source.s3_bucket_id
  s3_key = aws_s3_bucket_object.λ_output_validate.key
  s3_object_version = aws_s3_bucket_object.λ_output_validate.version_id

  runtime = "nodejs14.x"
  timeout = 120
  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
      DynamoDBTable: aws_dynamodb_table.this.name
      ErrorHandler: module.λ_error_handler.arn
      EndPoint: data.external.mediaconvert_endpoint.result.Url
    }
  }
}

data "aws_iam_policy_document" "λ_output_validate" {
  statement {
    actions = ["s3:GetObject"]
    resources = ["${module.s3_source.s3_bucket_arn}/*"]
  }
  statement {
    actions = ["s3:ListBucket"]
    resources = [module.s3_destination.s3_bucket_arn]
  }
  statement {
    actions = ["dynamodb:GetItem"]
    resources = [aws_dynamodb_table.this.arn]
  }
  statement {
    actions = ["lambda:InvokeFunction"]
    resources = [module.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_output_validate" {
  description = "${local.project} output validation"
  name = "${local.project}-output-validate-${data.aws_region.current.name}"
  policy = data.aws_iam_policy_document.λ_output_validate.json
}

resource "aws_iam_role_policy_attachment" "λ_output_validate" {
  role = module.λ_output_validate.role_name
  policy_arn = aws_iam_policy.λ_output_validate.arn
}