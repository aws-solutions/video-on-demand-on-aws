resource "aws_sfn_state_machine" "publish" {
  name     = "${local.project}-publish"
  role_arn = aws_iam_role.step_function_service_role.arn
  tags     = local.tags

  definition = jsonencode({
    "StartAt" : "Validate Encoding Outputs",
    "States" : {
      "Validate Encoding Outputs" : {
        "Type" : "Task",
        "Resource" : module.λ_output_validate.arn,
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
        "Resource" : module.λ_archive_source.arn,
        "Next" : "DynamoDB Update"
      },
      "Deep Archive" : {
        "Type" : "Task",
        "Resource" : module.λ_archive_source.arn,
        "Next" : "DynamoDB Update"
      },
      "DynamoDB Update" : {
        "Type" : "Task",
        "Resource" : module.λ_dynamodb_update.arn,
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
        "Resource" : module.λ_sqs_publish.arn,
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
        "Resource" : module.λ_sns_notification.arn,
        "Next" : "Complete"
      },
      "Complete" : {
        "Type" : "Pass",
        "End" : true
      }
    }
  })
}