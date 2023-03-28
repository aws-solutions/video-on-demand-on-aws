resource "aws_sfn_state_machine" "publish_tmp" {
  depends_on = [aws_cloudwatch_log_group.sfn_logs]

  name     = "${local.project}-tmp-publish"
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
    "StartAt" : "Validate Encoding Outputs",
    "States" : {
      "Validate Encoding Outputs" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_output_validate.arn,
        "Next" : "Create Seek Sprites"
      },
      "Create Seek Sprites" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_seek_sprites.arn,
        "Next" : "Archive Source Choice"
      },
      "Archive Source Choice" : {
        "Type" : "Choice",
        "Choices" : [
          {
            Variable : "$.archiveSource",
            StringEquals : "GLACIER",
            Next : "Archive"
          },
          {
            Variable : "$.archiveSource",
            StringEquals : "DEEP_ARCHIVE",
            Next : "Deep Archive"
          }
        ],
        "Default" : "DynamoDB Update"
      },
      "Archive" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_archive_source.arn,
        "Next" : "DynamoDB Update"
      },
      "Deep Archive" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_archive_source.arn,
        "Next" : "DynamoDB Update"
      },
      "DynamoDB Update" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_dynamodb_update.arn,
        "Next" : "Broadcast Dependencies"
      },
      "Broadcast Dependencies" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_broadcast.arn,
        "Next" : "SQS Choice"
      },
      "SQS Choice" : {
        "Type" : "Choice",
        "Choices" : [
          {
            Variable : "$.enableSqs",
            BooleanEquals : true,
            Next : "SQS Send Message"
          }
        ],
        "Default" : "SNS Choice"
      },
      "SQS Send Message" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_sqs_publish.arn,
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
        "Default" : "Complete"
      },
      "SNS Notification" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_sns_notification.arn,
        "Next" : "Complete"
      },
      "Complete" : {
        "Type" : "Pass",
        "End" : true
      }
    }
  })
}

resource "aws_sfn_state_machine" "publish" {
  depends_on = [aws_cloudwatch_log_group.sfn_logs]

  name     = "${local.project}-publish"
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
    "StartAt" : "Validate Encoding Outputs",
    "States" : {
      "Validate Encoding Outputs" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_output_validate.arn,
        "Next" : "Archive Source Choice"
      },
      "Archive Source Choice" : {
        "Type" : "Choice",
        "Choices" : [
          {
            Variable : "$.archiveSource",
            StringEquals : "GLACIER",
            Next : "Archive"
          },
          {
            Variable : "$.archiveSource",
            StringEquals : "DEEP_ARCHIVE",
            Next : "Deep Archive"
          }
        ],
        "Default" : "DynamoDB Update"
      },
      "Archive" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_archive_source.arn,
        "Next" : "DynamoDB Update"
      },
      "Deep Archive" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_archive_source.arn,
        "Next" : "DynamoDB Update"
      },
      "DynamoDB Update" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_dynamodb_update.arn,
        "Next" : "Broadcast Dependencies"
      },
      "Broadcast Dependencies" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_broadcast.arn,
        "Next" : "SQS Choice"
      },
      "SQS Choice" : {
        "Type" : "Choice",
        "Choices" : [
          {
            Variable : "$.enableSqs",
            BooleanEquals : true,
            Next : "SQS Send Message"
          }
        ],
        "Default" : "SNS Choice"
      },
      "SQS Send Message" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_sqs_publish.arn,
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
        "Default" : "Complete"
      },
      "SNS Notification" : {
        "Type" : "Task",
        "Resource" : aws_lambda_alias.λ_sns_notification.arn,
        "Next" : "Complete"
      },
      "Complete" : {
        "Type" : "Pass",
        "End" : true
      }
    }
  })
}
