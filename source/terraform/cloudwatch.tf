data "aws_lambda_function" "log_streaming" {
  function_name = "lambda-logs-to-elasticsearch"
}

resource "aws_cloudwatch_log_group" "sfn_logs" {
  name              = "/aws/sfn/${local.project}"
  retention_in_days = 7
}

resource "aws_lambda_permission" "log_streaming_lambda" {
  action        = "lambda:InvokeFunction"
  function_name = data.aws_lambda_function.log_streaming.arn
  principal     = "logs.${data.aws_region.current.name}.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.sfn_logs.arn}:*"
}

// TODO: we probably need to invest some time in grouping
// and optimizing the output for better searchability in Elasticsearch
resource "aws_cloudwatch_log_subscription_filter" "elasticsearch" {
  depends_on = [aws_lambda_permission.log_streaming_lambda]

  name            = "elasticsearch-stream-filter"
  log_group_name  = aws_cloudwatch_log_group.sfn_logs.name
  filter_pattern  = ""
  destination_arn = data.aws_lambda_function.log_streaming.arn
  distribution    = "ByLogStream"
}

#// https://docs.aws.amazon.com/step-functions/latest/dg/cw-events.html#cw-events-events
#resource "aws_cloudwatch_event_rule" "step_functions" {
#  name        = "${local.project}-step-functions-anomalies"
#  description = "Capture ${local.project} state machine anomalies."
#
#  event_pattern = jsonencode({
#    "detail-type" : ["Step Functions Execution Status Change"],
#    "source" : ["aws.states"],
#    resources : [
#      aws_sfn_state_machine.ingest.arn,
#      aws_sfn_state_machine.process.arn,
#      aws_sfn_state_machine.publish.arn
#    ],
#    "detail" : {
#      status : ["FAILED", "TIMED_OUT", "ABORTED"]
#    }
#  })
#}
#
#resource "aws_cloudwatch_event_target" "step_functions" {
#  arn  = data.aws_sns_topic.error_notifications.arn
#  rule = aws_cloudwatch_event_rule.step_functions.name
#}