S3_CLIENT = Aws::S3::Client.new(
  access_key_id: ENV['MINIO_ACCESS_KEY'],
  secret_access_key: ENV['MINIO_SECRET_KEY'],
  endpoint: ENV['MINIO_ENDPOINT'],
  region: 'us-east-1',
  force_path_style: true
)

S3_RESOURCE = Aws::S3::Resource.new(client: S3_CLIENT)