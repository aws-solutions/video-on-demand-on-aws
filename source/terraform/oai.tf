#####################################
# Origin Access Identities: VIDEOS
#####################################

data "aws_cloudfront_origin_access_identity" "videos" {
  id = "E3SZNNPM1B2DGA"
}

data "aws_iam_policy_document" "s3_policy_videos" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${module.s3_destination.s3_bucket_arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [data.aws_cloudfront_origin_access_identity.videos.iam_arn]
    }
  }
  statement {
    actions   = ["s3:ListBucket"]
    resources = [module.s3_destination.s3_bucket_arn]

    principals {
      type        = "AWS"
      identifiers = [data.aws_cloudfront_origin_access_identity.videos.iam_arn]
    }
  }


  statement {
    sid    = "denyInsecureTransport"
    effect = "Deny"

    actions = [
      "s3:*",
    ]

    resources = [
      module.s3_destination.s3_bucket_arn,
      "${module.s3_destination.s3_bucket_arn}/*",
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values = [
        "false"
      ]
    }
  }
}

##############################################
# Origin Access Identities: RESTRICTED VIDEOS
##############################################

data "aws_cloudfront_origin_access_identity" "restricted_videos" {
  id = "EWAJ0ASVCQJJU"
}

data "aws_iam_policy_document" "s3_policy_restricted_videos" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${module.s3_destination_for_restricted_videos.s3_bucket_arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [data.aws_cloudfront_origin_access_identity.restricted_videos.iam_arn]
    }
  }
  statement {
    actions   = ["s3:ListBucket"]
    resources = [module.s3_destination_for_restricted_videos.s3_bucket_arn]

    principals {
      type        = "AWS"
      identifiers = [data.aws_cloudfront_origin_access_identity.restricted_videos.iam_arn]
    }
  }

  statement {
    sid    = "denyInsecureTransport"
    effect = "Deny"

    actions = [
      "s3:*",
    ]

    resources = [
      module.s3_destination_for_restricted_videos.s3_bucket_arn,
      "${module.s3_destination_for_restricted_videos.s3_bucket_arn}/*",
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values = [
        "false"
      ]
    }
  }
}
