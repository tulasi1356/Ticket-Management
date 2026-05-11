# frozen_string_literal: true

# Uploads multipart files to MinIO when configured, otherwise stores on local disk.
class AttachmentUploadService
  MAX_BYTES = 15.megabytes

  class << self
    def upload!(uploaded_file, request:)
      raise ArgumentError, "Choose a file" if uploaded_file.blank?
      raise ArgumentError, "File is too large (max #{MAX_BYTES / 1.megabyte} MB)" if uploaded_file.size.to_i > MAX_BYTES

      uploaded_file.rewind if uploaded_file.respond_to?(:rewind)

      if S3_RESOURCE.present?
        begin
          return MinioUploadService.upload(uploaded_file).fetch(:url)
        rescue StandardError => e
          Rails.logger.warn("[AttachmentUploadService] MinIO upload failed (#{e.class}), using disk instead: #{e.message}")
          uploaded_file.rewind if uploaded_file.respond_to?(:rewind)
        end
      end

      DiskUploadService.store!(uploaded_file, request: request)
    end
  end
end
