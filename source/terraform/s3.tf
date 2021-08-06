module "s3_source" {
  source = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 2.0"

  bucket = "${local.project}-master-videos-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
  force_destroy = true
  versioning = {
    enabled = false
  }
  acl = "private"
  # S3 bucket-level Public Access Block configuration
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true

  lifecycle_rule = [
    {
      id = "${local.project}-source-archive"
      enabled = true
      tags = {
        "${local.project}" = "GLACIER"
      }
      transition = [{
        days = 1
        storage_class = "GLACIER"
      }]
    }, {
      id = "${local.project}-source-deep-archive"
      enabled = true
      tags = {
        "${local.project}" = "DEEP_ARCHIVE"
      }
      transition = [{
        days = 1
        storage_class = "DEEP_ARCHIVE"
      }]
    }]

  tags = local.tags
}

// https://github.com/terraform-aws-modules/terraform-aws-s3-bucket/tree/master/examples/notification
module "s3_source_notifications" {
  source = "terraform-aws-modules/s3-bucket/aws//modules/notification"

  bucket = module.s3_source.s3_bucket_id

  lambda_notifications = {
    mpg = {
      function_arn = module.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events = ["s3:ObjectCreated:*"]
      filter_suffix = ".mpg"
    }
    mp4 = {
      function_arn = module.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events = ["s3:ObjectCreated:*"]
      filter_suffix = ".mp4"
    }
    m4v = {
      function_arn = module.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events = ["s3:ObjectCreated:*"]
      filter_suffix = ".m4v"
    }
    mov = {
      function_arn = module.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events = ["s3:ObjectCreated:*"]
      filter_suffix = ".mov"
    }
    m2ts = {
      function_arn = module.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events = ["s3:ObjectCreated:*"]
      filter_suffix = ".m2ts"
    }
  }
}

module "s3_destination" {
  source = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 2.0"

  bucket = "${local.project}-transcoded-videos-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
  force_destroy = true
  versioning = {
    enabled = false
  }
  acl = "private"
  # S3 bucket-level Public Access Block configuration
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true

  tags = local.tags
}

module "s3_λ_source" {
  source = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 2.0"

  bucket = "${local.project}-lambda-sources-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
  force_destroy = true
  versioning = {
    enabled = true
  }
  acl = "private"
  # S3 bucket-level Public Access Block configuration
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true

  tags = local.tags
}
