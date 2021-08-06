resource "aws_iam_role" "media_transcode_role" {
  name = "${local.project}-media-transcode-role"
  assume_role_policy = data.aws_iam_policy_document.step_function_service_role.json

  inline_policy {
    name = "${local.project}-media-transcode-policy"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action = ["s3:GetObject", "s3:PutObject"]
          Effect = "Allow"
          Resource = [
            module.s3_source.s3_bucket_arn,
            module.s3_destination.s3_bucket_arn
          ]
        }, {
          Action = ["execute-api:Invoke"]
          Effect = "Allow"
          Resource = "arn:${data.aws_partition.current.partition}:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
        },
      ]
    })
  }
  tags = local.tags

}

data "aws_iam_policy_document" "media_transcode_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = ["mediaconvert.amazonaws.com"]
    }
  }
}

resource "aws_sfn_state_machine" "process" {
  name = "${local.project}-process"
  role_arn = aws_iam_role.step_function_service_role.arn

  definition = jsonencode({
    "Comment": "Process StateMachine to create MediaConvert Encoding Jobs",
    "StartAt": "Profiler",
    "States": {
      "Profiler": {
        "Type": "Task",
        "Resource": module.λ_profiler.invoke_arn,
        "Next": "Encoding Profile Check"
      },
      "Encoding Profile Check": {
        "Type": "Choice",
        "Choices": [
          {
            Variable: "$.isCustomTemplate",
            BooleanEquals: true,
            Next: "Custom jobTemplate"
          },
          {
            Variable: "$.encodingProfile ",
            NumericEquals: 2160,
            Next: "jobTemplate 2160p"
          },
          {
            Variable: "$.encodingProfile ",
            NumericEquals: 1080,
            Next: "jobTemplate 1080p"
          },
          {
            Variable: "$.encodingProfile ",
            NumericEquals: 720,
            Next: "jobTemplate 720p"
          }
        ]
      },
      "jobTemplate 2160p": {
        "Type": "Pass",
        "Next": "Accelerated Transcoding Check"
      },
      "jobTemplate 1080p": {
        "Type": "Pass",
        "Next": "Accelerated Transcoding Check"
      },
      "jobTemplate 720p": {
        "Type": "Pass",
        "Next": "Accelerated Transcoding Check"
      },
      "Custom jobTemplate": {
        "Type": "Pass",
        "Next": "Accelerated Transcoding Check"
      },
      "Accelerated Transcoding Check": {
        "Type": "Choice",
        "Choices": [
          {
            Variable: "$.acceleratedTranscoding",
            StringEquals: "ENABLED",
            Next: "Enabled"
          },
          {
            Variable: "$.acceleratedTranscoding",
            StringEquals: "PREFERRED",
            Next: "Preferred"
          },
          {
            Variable: "$.acceleratedTranscoding",
            StringEquals: "DISABLED",
            Next: "Disabled"
          }
        ]
      },
      "Enabled": {
        "Type": "Pass",
        "Next": "Frame Capture Check"
      },
      "Preferred": {
        "Type": "Pass",
        "Next": "Frame Capture Check"
      },
      "Disabled": {
        "Type": "Pass",
        "Next": "Frame Capture Check"
      },
      "Frame Capture Check": {
        "Type": "Choice",
        "Choices": [
          {
            Variable: "$.frameCapture",
            BooleanEquals: true,
            Next: "Frame Capture"
          },
          {
            Variable: "$.frameCapture",
            BooleanEquals: false,
            Next: "No Frame Capture"
          }
        ]
      },
      "Frame Capture": {
        "Type": "Pass",
        "Next": "Encode Job Submit"
      },
      "No Frame Capture": {
        "Type": "Pass",
        "Next": "Encode Job Submit"
      },
      "Encode Job Submit": {
        "Type": "Task",
        "Resource": module.λ_encode.invoke_arn,
        "Next": "DynamoDB Update"
      },
      "DynamoDB Update": {
        "Type": "Task",
        "Resource": module.λ_dynamodb_update.invoke_arn,
        "End": true
      }
    }
  })
}

resource "null_resource" "mediaconvert_templates" {
  triggers = {
    region = var.region
    function_name = var.function_name
    service_token = var.custom_resource_arn
    solution_id = var.solution_id
    solution_uuid = var.solution_uuid
    version = var.solution_version
    anonymous_usage = var.anonymous_usage
    cluster_size = var.cluster_size
  }

  provisioner "local-exec" {
    command = "node ../custom-resourc/mediaconvert/index.js ${data.external.mediaconvert_endpoint.Url} Create ${local.project}"
  }

  provisioner "local-exec" {
    when = destroy
    command = "node ../custom-resourc/mediaconvert/index.js ${data.external.mediaconvert_endpoint.Url} Delete ${local.project}"
  }
}