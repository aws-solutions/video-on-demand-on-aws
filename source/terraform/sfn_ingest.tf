resource "aws_sfn_state_machine" "ingest" {
  name     = "${local.project}-ingest"
  role_arn = aws_iam_role.step_function_service_role.arn
  tags     = local.tags

  definition = jsonencode({
    "StartAt" : "Input Validate",
    "States" : {
      "Input Validate" : {
        "Type" : "Task",
        "Resource" : module.λ_input_validate.arn,
        "Next" : "Mediainfo"
      },
      "Mediainfo" : {
        "Type" : "Task",
        "Resource" : module.λ_media_info.arn,
        "Next" : "DynamoDB Update"
      },
      "DynamoDB Update" : {
        "Type" : "Task",
        "Resource" : module.λ_dynamodb_update.arn,
        "Next" : "SNS Choice"
      },
      "SNS Choice" : {
        "Type" : "Choice",
        "Choices" : [
          {
            Variable : "$.enableSns",
            BooleanEquals : true,
            Next : "SNS Notification"
          }
        ],
        "Default" : "Process Execute"
      },
      "SNS Notification" : {
        "Type" : "Task",
        "Resource" : module.λ_sns_notification.arn,
        "Next" : "Process Execute"
      },
      "Process Execute" : {
        "Type" : "Task",
        "Resource" : module.λ_step_functions.arn,
        "End" : true
      }
    }
  })
}