resource "aws_cloudwatch_log_group" "sfn_logs" {
  name              = "/aws/sfn/${local.project}"
  retention_in_days = 7
}
