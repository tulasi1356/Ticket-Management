# frozen_string_literal: true

# Local file uploads when MinIO/S3 is not configured. Files live under storage/uploads.
class DiskUploadService
  STORAGE_DIR = Rails.root.join("storage", "uploads").freeze

  class << self
    def store!(uploaded_file, request:)
      FileUtils.mkdir_p(STORAGE_DIR)
      raise ArgumentError, "Missing file" if uploaded_file.blank?

      ext = File.extname(uploaded_file.original_filename.to_s)
      ext = ".bin" if ext.blank?

      basename = "#{SecureRandom.uuid}#{ext}"
      path = STORAGE_DIR.join(basename)

      # Prefer in-memory buffer: IO.copy_stream from tempfile paths can fail on some platforms /
      # multipart lifecycle when Rack still owns the tempfile handle.
      uploaded_file.rewind if uploaded_file.respond_to?(:rewind)
      File.binwrite(path, uploaded_file.read)
      uploaded_file.rewind if uploaded_file.respond_to?(:rewind)

      "#{request.base_url}/attachments/disk/#{basename}"
    end
  end
end
