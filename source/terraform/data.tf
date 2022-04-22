locals {
  project             = "buzzhub"
  environment         = "production"
  lambda_insights_arn = "arn:aws:lambda:${data.aws_region.current.name}:580247275435:layer:LambdaInsightsExtension:18"
  lambda_package_dir  = "../../target"
  s3_prefix           = "package"

  tags = {
    managed_by   = "terraform"
    map-migrated = "d-server-00fvusu7ux3q9a"
    service      = local.project
    source       = "https://github.com/stroeer/video-on-demand-on-aws"
    App          = "Video"
  }
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

data "aws_sns_topic" "codestar_notifications" {
  name = "codestar-notifications"
}

data "aws_sns_topic" "error_notifications" {
  name = "cloudwatch-notifications"
}

data "aws_lambda_function" "log_streaming" {
  function_name = "lambda-logs-to-elasticsearch"
}
