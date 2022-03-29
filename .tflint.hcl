config {
  module = true
}

plugin "aws" {
  enabled = true
  version = "0.13.1"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}
