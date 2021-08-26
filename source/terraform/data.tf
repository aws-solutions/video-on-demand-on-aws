locals {
  project            = "buzzhub"
  environment        = "production"
  lambda_package_dir = "../../target"
  s3_prefix          = "package"
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
