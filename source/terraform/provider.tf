provider "aws" {
  region = var.region

  default_tags {
    tags = local.tags
  }
}

provider "external" {}

provider "opensearch" {
  aws_region  = data.aws_region.current.name
  healthcheck = true
  url         = "https://logs.stroeer.engineering"
}
