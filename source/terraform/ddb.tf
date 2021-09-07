resource "aws_dynamodb_table" "this" {
  name         = local.project
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "guid"

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

  attribute {
    name = "ttl"
    type = "N"
  }

  global_secondary_index {
    name            = "srcBucket-startTime-index"
    hash_key        = "srcBucket"
    range_key       = "startTime"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "scheduled-events"
    hash_key        = "guid"
    range_key       = "ttl"
    projection_type = "KEYS_ONLY"
  }
}

