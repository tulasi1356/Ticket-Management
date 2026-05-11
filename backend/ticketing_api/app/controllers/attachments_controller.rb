# frozen_string_literal: true

class AttachmentsController < ApplicationController
  # Authenticated uploads; disk blobs use UUID filenames so <img> can fetch without headers.
  before_action :require_current_user, only: [:create]

  def create
    file = params[:file]
    return render json: { error: "file is required (multipart)" }, status: :unprocessable_entity if file.blank?

    url = AttachmentUploadService.upload!(file, request: request)
    render json: { url: url }, status: :created
  rescue ArgumentError => e
    render json: { error: e.message }, status: :unprocessable_entity
  rescue StandardError => e
    Rails.logger.error("[attachments#create] #{e.class}: #{e.message}\n#{e.backtrace&.first(8)&.join("\n")}")
    render json: { error: e.message.presence || "Upload failed" }, status: :internal_server_error
  end

  # Public read (opaque UUID filenames) so <img src> works without sending X-User-Id.
  def show_disk
    filename = File.basename(params[:filename].to_s)
    path = DiskUploadService::STORAGE_DIR.join(filename)
    return head :not_found unless path.file? && path.to_s.start_with?(DiskUploadService::STORAGE_DIR.to_s)

    type = Rack::Mime.mime_type(File.extname(path), "application/octet-stream")
    send_file path.to_s,
              type: type,
              disposition: :inline,
              filename: filename
  end
end
