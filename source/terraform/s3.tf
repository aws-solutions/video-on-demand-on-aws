module "s3_source" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 2.0"

  bucket        = "${local.project}-master-videos-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
  force_destroy = true
  versioning = {
    enabled = false
  }
  acl = "private"
  # S3 bucket-level Public Access Block configuration
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  tags = local.tags
}

module "s3_destination" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 2.0"

  bucket        = "${local.project}-transcoded-videos-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
  force_destroy = true
  versioning = {
    enabled = false
  }
  acl = "private"
  # S3 bucket-level Public Access Block configuration
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  tags = local.tags
}

module "s3_λ_source" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 2.0"

  bucket        = "${local.project}-lambda-sources-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
  force_destroy = true
  versioning = {
    enabled = true
  }
  acl = "private"
  # S3 bucket-level Public Access Block configuration
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  tags = local.tags
}
