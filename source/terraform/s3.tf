locals {
  cors_allowed_origins = [
    "https://www.t-online.de",
    "https://beta.t-online.de",
    "https://beta.stroeer.engineering",
    "https://varnish-eu-west-1.stroeer.engineering",
    "https://paper-eu-west-1.stroeer.engineering",
    "http://localhost:3000",
    "http://local.t-online.de:3000"
  ]
}

module "s3_source" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 2.0"

  acl           = "private"
  bucket        = "${local.project}-master-videos-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
  force_destroy = true

  # S3 bucket-level Public Access Block configuration
  block_public_acls                     = true
  block_public_policy                   = true
  ignore_public_acls                    = true
  restrict_public_buckets               = true
  attach_deny_insecure_transport_policy = true
  server_side_encryption_configuration  = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "aws:kms"
      }
    }
  }

  lifecycle_rule = [
    {
      id         = "${local.project}-source-archive"
      enabled    = true
      tags       = {
        "${local.project}" = "GLACIER"
      }
      transition = [
        {
          days          = 1
          storage_class = "GLACIER"
        }
      ]
    }, {
      id         = "${local.project}-source-deep-archive"
      enabled    = true
      tags       = {
        "${local.project}" = "DEEP_ARCHIVE"
      }
      transition = [
        {
          days          = 1
          storage_class = "DEEP_ARCHIVE"
        }
      ]
    }
  ]

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
    mpg  = {
      function_arn  = aws_lambda_alias.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events        = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
      filter_suffix = ".mpg"
      qualifier     = aws_lambda_alias.λ_step_functions.name
    }
    mp4  = {
      function_arn  = aws_lambda_alias.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events        = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
      filter_suffix = ".mp4"
      qualifier     = aws_lambda_alias.λ_step_functions.name
    }
    m4v  = {
      function_arn  = aws_lambda_alias.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events        = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
      filter_suffix = ".m4v"
      qualifier     = aws_lambda_alias.λ_step_functions.name
    }
    mov  = {
      function_arn  = aws_lambda_alias.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events        = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
      filter_suffix = ".mov"
      qualifier     = aws_lambda_alias.λ_step_functions.name
    }
    m2ts = {
      function_arn  = aws_lambda_alias.λ_step_functions.arn
      function_name = module.λ_step_functions.function_name
      events        = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
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

  # S3 bucket-level Public Access Block configuration
  block_public_acls                     = true
  block_public_policy                   = true
  ignore_public_acls                    = true
  restrict_public_buckets               = true
  attach_deny_insecure_transport_policy = true
  server_side_encryption_configuration  = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "aws:kms"
      }
    }
  }

  cors_rule = [
    {
      allowed_methods = ["GET", "HEAD"]
      allowed_origins = local.cors_allowed_origins
      allowed_headers = ["*"]
      expose_headers  = ["ETag"]
      max_age_seconds = 3600
    }
  ]

  versioning = {
    enabled = false
  }
}

module "s3_destination_for_restricted_videos" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 2.0"

  acl           = "private"
  bucket        = "${local.project}-transcoded-restricted-videos-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
  force_destroy = true

  # S3 bucket-level Public Access Block configuration
  block_public_acls                     = true
  block_public_policy                   = true
  ignore_public_acls                    = true
  restrict_public_buckets               = true
  attach_deny_insecure_transport_policy = true
  server_side_encryption_configuration  = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "aws:kms"
      }
    }
  }

  cors_rule = [
    {
      allowed_methods = ["GET", "HEAD"]
      allowed_origins = local.cors_allowed_origins
      allowed_headers = ["*"]
      expose_headers  = ["ETag"]
      max_age_seconds = 3600
    }
  ]


  versioning = {
    enabled = false
  }
}
#####################################################
# we need a certain redirect for videos.t-online.de:
#####################################################
locals {
  video_redirect = <<EOF
<html lang="de">
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="3;url=https://www.t-online.de/tv/">
    <title>videos.t-online.de</title>
</head>
<body>
<a href="https://www.t-online.de/tv/">Falls Sie nicht automatisch weitergeleitet werden, klicken sie bitte hier.</a>
<script>window.location.replace("https://www.t-online.de/tv/");</script>
</body>
</html>
EOF
}
resource "aws_s3_bucket_object" "redirect_videos" {
  bucket           = module.s3_destination.s3_bucket_id
  key              = "index.html"
  content          = local.video_redirect
  cache_control    = "public, max-age=3600"
  content_type     = "text/html; charset=UTF-8"
  content_encoding = "UTF-8"
  etag             = md5(local.video_redirect)
}
resource "aws_s3_bucket_object" "redirect_videos_restricted" {
  bucket           = module.s3_destination_for_restricted_videos.s3_bucket_id
  key              = "index.html"
  content          = local.video_redirect
  content_type     = "text/html; charset=UTF-8"
  cache_control    = "public, max-age=3600"
  content_encoding = "UTF-8"
  etag             = md5(local.video_redirect)
}

module "s3_λ_source" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 2.0"

  acl           = "private"
  bucket        = "${local.project}-lambda-source-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
  force_destroy = true

  # S3 bucket-level Public Access Block configuration
  block_public_acls                     = true
  block_public_policy                   = true
  ignore_public_acls                    = true
  restrict_public_buckets               = true
  attach_deny_insecure_transport_policy = true
  server_side_encryption_configuration  = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "aws:kms"
      }
    }
  }
}