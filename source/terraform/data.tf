data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  project            = "buzzhub"
  lambda_package_dir = "../../target/regional-s3-assets"
  tags = {
    managed_by   = "terraform"
    map-migrated = "d-server-00fvusu7ux3q9a"
    service      = local.project
    source       = "https://github.com/stroeer/video-on-demand-on-aws"
    App          = "Video"
  }
}