module "s3_source" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 2.0"

  acl           = "private"
  bucket        = "${local.project}-master-videos-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
  force_destroy = true
  tags          = local.tags

  # S3 bucket-level Public Access Block configuration
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  lifecycle_rule = [
    {
      id      = "${local.project}-source-archive"
      enabled = true
      tags = {
        "${local.project}" = "GLACIER"
      }
      transition = [{
        days          = 1
        storage_class = "GLACIER"
      }]
      }, {
      id      = "${local.project}-source-deep-archive"
      enabled = true
      tags = {
        "${local.project}" = "DEEP_ARCHIVE"
      }
      transition = [{
        days          = 1
        storage_class = "DEEP_ARCHIVE"
      }]
  }]

  versioning = {
    enabled = false
  }
}

// https://github.com/terraform-aws-modules/terraform-aws-s3-bucket/tree/master/examples/notification
module "s3_source_notifications" {
  source  = "terraform-aws-modules/s3-bucket/aws//modules/notification"
  version = "~> 2.0"

  bucket = module.s3_source.s3_bucket_id

  lambda_notifications = {
    mpg = {
      function_arn  = aws_lambda_alias.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events        = ["s3:ObjectCreated:*"]
      filter_suffix = ".mpg"
      qualifier     = aws_lambda_alias.λ_step_functions.name
    }
    mp4 = {
      function_arn  = aws_lambda_alias.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events        = ["s3:ObjectCreated:*"]
      filter_suffix = ".mp4"
      qualifier     = aws_lambda_alias.λ_step_functions.name
    }
    m4v = {
      function_arn  = aws_lambda_alias.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events        = ["s3:ObjectCreated:*"]
      filter_suffix = ".m4v"
      qualifier     = aws_lambda_alias.λ_step_functions.name
    }
    mov = {
      function_arn  = aws_lambda_alias.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events        = ["s3:ObjectCreated:*"]
      filter_suffix = ".mov"
      qualifier     = aws_lambda_alias.λ_step_functions.name
    }
    m2ts = {
      function_arn  = aws_lambda_alias.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events        = ["s3:ObjectCreated:*"]
      filter_suffix = ".m2ts"
      qualifier     = aws_lambda_alias.λ_step_functions.name
    }
  }
}

module "s3_destination" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 2.0"

  acl           = "private"
  bucket        = "${local.project}-transcoded-videos-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
  force_destroy = true
  tags          = local.tags

  # S3 bucket-level Public Access Block configuration
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  versioning = {
    enabled = false
  }

}

resource "aws_s3_bucket" "s3_λ_source" {
  acl           = "private"
  bucket        = "${local.project}-lambda-sources-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
  force_destroy = true
  tags          = local.tags

  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "source" {
  bucket = aws_s3_bucket.s3_λ_source.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
