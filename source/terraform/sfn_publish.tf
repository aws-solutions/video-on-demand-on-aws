resource "aws_cloudwatch_event_rule" "encode_complete" {
  name = "${local.project}-encode-complete"
  event_pattern = jsonencode({
    "source" : [
      "aws.mediaconvert"
    ],
    "detail": {
      "status": [
        "COMPLETE"
      ],
      "userMetadata": {
        "workflow": [
          local.project
        ]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "encode_complete" {
  target_id = "${local.project}-StepFunctions"
  rule = aws_cloudwatch_event_rule.encode_complete.name
  arn = module.λ_step_functions.arn
  // todo
}

resource "aws_sfn_state_machine" "publish" {
  name = "${local.project}-publish"
  role_arn = aws_iam_role.step_function_service_role.arn

  definition = jsonencode({
    "StartAt": "Validate Encoding Outputs",
    "States": {
      "Validate Encoding Outputs": {
        "Type": "Task",
        "Resource": module.λ_output_validate.invoke_arn,
        "Next": "Archive Source Choice"
      },
      "Archive Source Choice": {
        "Type": "Choice",
        "Choices": [
          {
            Variable: "$.archiveSource",
            StringEquals: "GLACIER",
            Next: "Archive"
          },
          {
            Variable: "$.archiveSource",
            StringEquals: "DEEP_ARCHIVE",
            Next: "Deep Archive"
          }
        ],
        "Default": "DynamoDB Update"
      },
      "Archive": {
        "Type": "Task",
        "Resource": module.λ_archive_source.invoke_arn,
        "Next": "DynamoDB Update"
      },
      "Deep Archive": {
        "Type": "Task",
        "Resource": module.λ_archive_source.invoke_arn,
        "Next": "DynamoDB Update"
      },
      "DynamoDB Update": {
        "Type": "Task",
        "Resource": module.λ_dynamodb_update.invoke_arn,
        "Next": "SQS Choice"
      },
      "SQS Choice": {
        "Type": "Choice",
        "Choices": [
          {
            Variable: "$.enableSqs",
            BooleanEquals: true,
            Next: "SQS Send Message"
          }
        ],
        "Default": "SNS Choice"
      },
      "SQS Send Message": {
        "Type": "Task",
        "Resource": module.λ_sqs_publish.invoke_arn,
        "Next": "SNS Choice"
      },
      "SNS Choice": {
        "Type": "Choice",
        "Choices": [
          {
            Variable: "$.enableSns",
            BooleanEquals: true,
            Next: "SNS Notification"
          }
        ],
        "Default": "Complete"
      },
      "SNS Notification": {
        "Type": "Task",
        "Resource": module.λ_sns_notification.invoke_arn,
        "Next": "Complete"
      },
      "Complete": {
        "Type": "Pass",
        "End": true
      }
    }
  })
}