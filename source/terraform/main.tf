locals {
  project = "buzzhub"
  lambda_package_dir = "../../target/regional-s3-assets"
  tags = {
    App = "Video"
  }
}

resource "aws_dynamodb_table" "this" {
  name = local.project
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "guid"

  attribute {
    name = "guid"
    type = "S"
  }

  attribute {
    name = "srcBucket"
    type = "S"
  }

  attribute {
    name = "startTime"
    type = "S"
  }

  global_secondary_index {
    name = "srcBucket-startTime-index"
    hash_key = "srcBucket"
    range_key = "startTime"
    projection_type = "ALL"
  }

  tags = local.tags
}

