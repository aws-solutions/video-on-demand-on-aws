locals {
  codebuild_cloudwatch_logs_retention_in_days = 7
  project                                     = "buzzhub"
  environment                                 = "production"
  lambda_package_dir                          = "../../target"
  s3_prefix                                   = "package"

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

data "aws_vpc" "selected" {
  tags = {
    Name = "main"
  }
}

data "aws_subnets" "selected" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.selected.id]
  }

  tags = {
    Tier = "private"
  }
}

data "aws_security_group" "vpc_endpoints" {
  name = "vpc-endpoint-access"
}
data "aws_security_group" "all_outbound" {
  name = "allow-outbound-tcp"
}
data "aws_security_group" "lambda" {
  name = "lambda-default"
}