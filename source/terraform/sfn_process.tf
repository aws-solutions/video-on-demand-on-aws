resource "aws_iam_role" "media_transcode_role" {
  name               = "${local.project}-media-transcode-role"
  assume_role_policy = data.aws_iam_policy_document.media_transcode_role.json

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
          }, {
          Action   = ["execute-api:Invoke"]
          Effect   = "Allow"
          Resource = "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
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
      type        = "Service"
      identifiers = ["mediaconvert.amazonaws.com"]
    }
  }
}

resource "aws_sfn_state_machine" "process" {
  name     = "${local.project}-process"
  role_arn = aws_iam_role.step_function_service_role.arn
  tags     = local.tags

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
    endpoint = data.external.mediaconvert_endpoint.result.Url
    project  = local.project
  }

  provisioner "local-exec" {
    command = "node ../custom-resource/mediaconvert/index.js ${self.triggers.endpoint} Create ${self.triggers.project}"
  }

  provisioner "local-exec" {
    when    = destroy
    command = "node ../custom-resource/mediaconvert/index.js ${self.triggers.endpoint} Delete ${self.triggers.project}"
  }
}

# todo (mana): STATUS_UPDATE events to update progress within the CMS
# also available: PROGRESSING, INPUT_INFORMATION

###############################
# MEDIA CONVERT COMPLETE EVENTS
###############################

resource "aws_lambda_permission" "encode_complete" {
  statement_id  = "AllowExecutionFromCloudWatchWhenComplete"
  action        = "lambda:InvokeFunction"
  function_name = module.λ_step_functions.arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.encode_complete.arn
}

resource "aws_cloudwatch_event_rule" "encode_complete" {
  name        = "${local.project}-EncodeComplete"
  description = "MediaConvert Completed event rule"

  event_pattern = jsonencode({
    source = ["aws.mediaconvert"]
    detail = {
      status = ["COMPLETE"],
      userMetadata = {
        workflow : [local.project]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "encode_complete" {
  rule      = aws_cloudwatch_event_rule.encode_complete.name
  target_id = "${local.project}-StepFunctions"
  arn       = module.λ_step_functions.arn
}

############################
# MEDIA CONVERT ERROR EVENTS
############################

resource "aws_lambda_permission" "encode_error" {
  statement_id  = "AllowExecutionFromCloudWatchInCaseOfError"
  action        = "lambda:InvokeFunction"
  function_name = module.λ_error_handler.arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.encode_error.arn
}

resource "aws_cloudwatch_event_rule" "encode_error" {
  name        = "${local.project}-EncodeError"
  description = "MediaConvert Error event rule"

  event_pattern = jsonencode({
    source = ["aws.mediaconvert"]
    detail = {
      status = ["ERROR"],
      userMetadata = {
        workflow : [local.project]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "encode_error" {
  rule      = aws_cloudwatch_event_rule.encode_error.name
  target_id = "${local.project}-EncodeError"
  arn       = module.λ_error_handler.arn
}