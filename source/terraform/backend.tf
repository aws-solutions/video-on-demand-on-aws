terraform {
  backend "s3" {
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }

    external = {
      source  = "hashicorp/external"
      version = "~> 2.1"
    }

    opensearch = {
      source  = "opensearch-project/opensearch"
      version = "1.0.0-beta.2"
    }
  }

  required_version = "~> 1.0"
}
