resource "aws_iam_role" "step_function_service_role" {
  name               = "${local.project}-stepfunction-service-role"
  assume_role_policy = data.aws_iam_policy_document.step_function_service_role.json
  inline_policy {
    name = "${local.project}-stepfunction-service-policy"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action   = ["lambda:InvokeFunction"]
          Effect   = "Allow"
          Resource = "*"
        },
      ]
    })
  }
  tags = local.tags
}

data "aws_iam_policy_document" "step_function_service_role" {
  statement {
    actions = [
    "sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["states.${data.aws_region.current.name}.amazonaws.com"]
    }
  }
}