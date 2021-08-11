resource "aws_iam_role" "step_function_service_role" {
  assume_role_policy = data.aws_iam_policy_document.step_function_service_role.json
  name               = "${local.project}-stepfunction-service-role"
  tags               = local.tags

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
}

data "aws_iam_policy_document" "step_function_service_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["states.${data.aws_region.current.name}.amazonaws.com"]
    }
  }
}