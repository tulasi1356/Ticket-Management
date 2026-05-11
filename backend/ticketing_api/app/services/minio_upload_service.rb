class MinioUploadService
    def self.upload(file)
      raise "MinIO is not configured (set MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_ENDPOINT)" if S3_RESOURCE.nil?

      bucket = ENV["MINIO_BUCKET"].presence
      raise "MINIO_BUCKET is not set" if bucket.blank?
  
      filename = "#{SecureRandom.uuid}_#{file.original_filename}"
  
      object = S3_RESOURCE.bucket(bucket).object(filename)
  
      object.upload_file(file.tempfile.path)
  
      {
        url: "#{ENV['MINIO_ENDPOINT']}/#{bucket}/#{filename}",
        filename: file.original_filename,
        content_type: file.content_type,
        size: file.size
      }
    end
  end