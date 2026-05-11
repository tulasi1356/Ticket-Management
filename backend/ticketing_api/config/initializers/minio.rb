# Only build clients when MinIO is configured. Otherwise the AWS SDK probes the
# EC2 instance metadata service (169.254.169.254), which times out on local Macs.
minio_ready =
  ENV["MINIO_ACCESS_KEY"].present? &&
  ENV["MINIO_SECRET_KEY"].present? &&
  ENV["MINIO_ENDPOINT"].present?

S3_CLIENT =
  if minio_ready
    Aws::S3::Client.new(
      access_key_id: ENV.fetch("MINIO_ACCESS_KEY"),
      secret_access_key: ENV.fetch("MINIO_SECRET_KEY"),
      endpoint: ENV.fetch("MINIO_ENDPOINT"),
      region: "us-east-1",
      force_path_style: true
    )
  end

S3_RESOURCE = minio_ready ? Aws::S3::Resource.new(client: S3_CLIENT) : nil