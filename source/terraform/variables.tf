variable "glacier" {
  default     = "DEEP_ARCHIVE"
  type        = string
  validation {
    condition     = contains(["DISABLED", "GLACIER", "DEEP_ARCHIVE"], var.glacier)
    error_message = "Must be one of (DISABLED|GLACIER|DEEP_ARCHIVE)."
  }
  description = "If enabled, source assets will be tagged for archiving to Glacier or Glacier Deep Archive once the workflow is complete."
}

variable "frame_capture" {
  default     = false
  type        = bool
  description = "If enabled, frame capture is added to the job submitted to MediaConvert."
}

variable "accelerated_transcoding" {
  default     = "PREFERRED"
  type        = string
  validation {
    condition     = contains(["ENABLED", "DISABLED", "PREFERRED"], var.accelerated_transcoding)
    error_message = "Must be one of (ENABLED|DISABLED|PREFERRED)."
  }
  description = "Enable accelerated transcoding in AWS Elemental MediaConvert. PREFERRED will only use acceleration if the input files is supported. ENABLED accleration is applied to all files (this will fail for unsupported file types) see MediaConvert Documentation for more detail https."
}