resource "aws_sfn_state_machine" "ingest" {
  depends_on = [aws_cloudwatch_log_group.sfn_logs]

  name     = "${local.project}-ingest"
  role_arn = aws_iam_role.step_function_service_role.arn

  logging_configuration {
    include_execution_data = true
    log_destination        = "${aws_cloudwatch_log_group.sfn_logs.arn}:*"
    level                  = "ALL"
  }

  tracing_configuration {
    enabled = false
  }

  definition = jsonencode({
    "StartAt" : "Input Validate",
    "States" : {
      "Input Validate" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_input_validate.arn,
        "Next" : "Cleanup Choice"
      },
      "Cleanup Choice" : {
        "Type" : "Choice",
        "Choices" : [
          {
            Variable : "$.doPurge",
            BooleanEquals : true,
            Next : "Purge"
          }
        ],
        "Default" : "Mediainfo"
      },
      "Purge" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_purge.arn,
        Next : "Broadcast Dependencies"
      },
      "Broadcast Dependencies" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_broadcast.arn,
        "End" : true
      },
      "Mediainfo" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_media_info.arn,
        "Next" : "DynamoDB Update"
      },
      "DynamoDB Update" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_dynamodb_update.arn,
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
        "Resource" : aws_lambda_alias.λ_sns_notification.arn,
        "Next" : "Process Execute"
      },
      "Process Execute" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_step_functions.arn
        "End" : true
      }
    }
  })
}
