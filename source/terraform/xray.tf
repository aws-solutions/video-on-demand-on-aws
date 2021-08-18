resource "aws_xray_group" "buzzhub" {
  filter_expression = "service(\"${aws_sfn_state_machine.ingest.name}\") OR service(\"${aws_sfn_state_machine.process.name}\") OR service(\"${aws_sfn_state_machine.publish.name}\")"
  group_name        = local.project
  tags              = local.tags
}
