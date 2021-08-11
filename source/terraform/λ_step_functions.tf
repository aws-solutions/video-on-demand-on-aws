resource "aws_s3_bucket_object" "λ_step_functions" {
  bucket = module.s3_λ_source.s3_bucket_id
  key    = "step-functions/package.zip"
  source = "${local.lambda_package_dir}/step-functions.zip"
  etag   = filemd5("${local.lambda_package_dir}/step-functions.zip")
}

module "λ_step_functions" {
  source  = "moritzzimmer/lambda/aws"
  version = "5.12.2"

  function_name = "${local.project}-step-functions"
  description   = "Creates a unique identifier (GUID) and executes the Ingest StateMachine"
  handler       = "index.handler"

  s3_bucket         = module.s3_λ_source.s3_bucket_id
  s3_key            = aws_s3_bucket_object.λ_step_functions.key
  s3_object_version = aws_s3_bucket_object.λ_step_functions.version_id

  runtime = "nodejs14.x"
  timeout = 120
  environment = {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED : "1"
      IngestWorkflow : "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-ingest"
      ProcessWorkflow : "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-process"
      PublishWorkflow : "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-publish"
      ErrorHandler : module.λ_error_handler.arn
    }
  }

  tags = local.tags
}

data "aws_iam_policy_document" "λ_step_functions" {
  statement {
    actions = ["states:StartExecution"]
    resources = [
      "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-ingest",
      "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-process",
      "arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:${local.project}-publish"
    ]
  }
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [module.λ_error_handler.arn]
  }
}

resource "aws_iam_policy" "λ_step_functions" {
  description = "${local.project} input validation"
  name        = "${local.project}-step-functions-${data.aws_region.current.name}"
  policy      = data.aws_iam_policy_document.λ_step_functions.json
}

resource "aws_iam_role_policy_attachment" "λ_step_functions" {
  role       = module.λ_step_functions.role_name
  policy_arn = aws_iam_policy.λ_step_functions.arn
}