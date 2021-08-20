resource "aws_iam_role" "media_transcode_role" {
  assume_role_policy = data.aws_iam_policy_document.media_transcode_role.json
  name               = "${local.project}-media-transcode-role"
  tags               = local.tags

  inline_policy {
    name = "${local.project}-media-transcode-policy"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action = ["s3:GetObject", "s3:PutObject"]
          Effect = "Allow"
          Resource = [
            "${module.s3_source.s3_bucket_arn}/*",
            "${module.s3_destination.s3_bucket_arn}/*"
          ]
        },
        {
          Action   = ["execute-api:Invoke"]
          Effect   = "Allow"
          Resource = "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
        },
      ]
    })
  }
}

data "aws_iam_policy_document" "media_transcode_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["mediaconvert.amazonaws.com"]
    }
  }
}

resource "aws_sfn_state_machine" "process" {
  depends_on = [aws_cloudwatch_log_group.sfn_logs]

  name     = "${local.project}-process"
  role_arn = aws_iam_role.step_function_service_role.arn
  tags     = local.tags

  logging_configuration {
    include_execution_data = true
    log_destination        = "${aws_cloudwatch_log_group.sfn_logs.arn}:*"
    level                  = "ALL"
  }

  tracing_configuration {
    enabled = true
  }

  definition = jsonencode({
    "Comment" : "Process StateMachine to create MediaConvert Encoding Jobs",
    "StartAt" : "Profiler",
    "States" : {
      "Profiler" : {
        "Type" : "Task",
        "Resource" : module.λ_profiler.arn,
        "Next" : "Encoding Profile Check"
      },
      "Encoding Profile Check" : {
        "Type" : "Choice",
        "Choices" : [
          {
            Variable : "$.isCustomTemplate",
            BooleanEquals : true,
            Next : "Custom jobTemplate"
          },
          {
            Variable : "$.encodingProfile ",
            NumericEquals : 1080,
            Next : "jobTemplate 1080p"
          },
          {
            Variable : "$.encodingProfile ",
            NumericEquals : 720,
            Next : "jobTemplate 720p"
          }
        ]
      },
      "jobTemplate 1080p" : {
        "Type" : "Pass",
        "Next" : "Accelerated Transcoding Check"
      },
      "jobTemplate 720p" : {
        "Type" : "Pass",
        "Next" : "Accelerated Transcoding Check"
      },
      "Custom jobTemplate" : {
        "Type" : "Pass",
        "Next" : "Accelerated Transcoding Check"
      },
      "Accelerated Transcoding Check" : {
        "Type" : "Choice",
        "Choices" : [
          {
            Variable : "$.acceleratedTranscoding",
            StringEquals : "ENABLED",
            Next : "Enabled"
          },
          {
            Variable : "$.acceleratedTranscoding",
            StringEquals : "PREFERRED",
            Next : "Preferred"
          },
          {
            Variable : "$.acceleratedTranscoding",
            StringEquals : "DISABLED",
            Next : "Disabled"
          }
        ]
      },
      "Enabled" : {
        "Type" : "Pass",
        "Next" : "Frame Capture Check"
      },
      "Preferred" : {
        "Type" : "Pass",
        "Next" : "Frame Capture Check"
      },
      "Disabled" : {
        "Type" : "Pass",
        "Next" : "Frame Capture Check"
      },
      "Frame Capture Check" : {
        "Type" : "Choice",
        "Choices" : [
          {
            Variable : "$.frameCapture",
            BooleanEquals : true,
            Next : "Frame Capture"
          },
          {
            Variable : "$.frameCapture",
            BooleanEquals : false,
            Next : "No Frame Capture"
          }
        ]
      },
      "Frame Capture" : {
        "Type" : "Pass",
        "Next" : "Encode Job Submit"
      },
      "No Frame Capture" : {
        "Type" : "Pass",
        "Next" : "Encode Job Submit"
      },
      "Encode Job Submit" : {
        "Type" : "Task",
        "Resource" : module.λ_encode.arn,
        "Next" : "DynamoDB Update"
      },
      "DynamoDB Update" : {
        "Type" : "Task",
        "Resource" : module.λ_dynamodb_update.arn,
        "End" : true
      }
    }
  })
}

resource "null_resource" "mediaconvert_templates" {
  triggers = {
    endpoint           = data.external.mediaconvert_endpoint.result.Url
    project            = local.project
    // arbitrary triggers to force a replacement for this resource if something changes
    index_js           = filemd5("../custom-resource/index.js")
    tmpl_720           = filemd5("../custom-resource/templates/720p_avc_aac_16x9_qvbr_no_preset.json")
    tmpl_720_no_audio  = filemd5("../custom-resource/templates/720p_avc_16x9_qvbr_no_preset.json")
    tmpl_1080          = filemd5("../custom-resource/templates/1080p_avc_aac_16x9_qvbr_no_preset.json")
    tmpl_1080_no_audio = filemd5("../custom-resource/templates/1080p_avc_16x9_qvbr_no_preset.json")
  }

  provisioner "local-exec" {
    command = "node ../custom-resource/index.js ${self.triggers.endpoint} Create ${self.triggers.project}"
  }

  provisioner "local-exec" {
    when    = destroy
    command = "node ../custom-resource/index.js ${self.triggers.endpoint} Delete ${self.triggers.project}"
  }
}
