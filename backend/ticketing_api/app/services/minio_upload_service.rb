class MinioUploadService
    def self.upload(file)
      bucket = ENV['MINIO_BUCKET']
  
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