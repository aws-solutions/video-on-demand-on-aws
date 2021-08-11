resource "aws_sns_topic" "notifications" {
  display_name      = "${local.project}-notifications"
  kms_master_key_id = "alias/aws/sns"
  tags              = local.tags
}
resource "aws_sns_topic_subscription" "admin_debug" {
  endpoint  = "mnaber@stroeer.de"
  protocol  = "email"
  topic_arn = aws_sns_topic.notifications.arn
}

resource "aws_sqs_queue" "notifications" {
  visibility_timeout_seconds        = 120
  name                              = "${local.project}-notfications"
  kms_data_key_reuse_period_seconds = 300
  kms_master_key_id                 = "alias/aws/sqs"
  tags                              = local.tags

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notifications_dlq.arn
    maxReceiveCount     = 1
  })
}
resource "aws_sqs_queue" "notifications_dlq" {
  visibility_timeout_seconds        = 120
  name                              = "${local.project}-notfications-dlq"
  kms_data_key_reuse_period_seconds = 300
  kms_master_key_id                 = "alias/aws/sqs"
  tags                              = local.tags
}