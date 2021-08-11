terraform {
  backend "s3" {
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.1"
    }

    external = {
      source  = "hashicorp/external"
      version = "~> 2.1"
    }
  }

  required_version = "~> 1.0"
}
