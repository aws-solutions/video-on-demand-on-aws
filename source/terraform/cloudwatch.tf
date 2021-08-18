data "aws_lambda_function" "log_streaming" {
  function_name = "lambda-logs-to-elasticsearch"
}

resource "aws_cloudwatch_log_group" "sfn_logs" {
  name              = "/aws/sfn/${local.project}"
  retention_in_days = 1
  tags              = local.tags
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

