# frozen_string_literal: true

class ExportAdminSummaryJob < ApplicationJob
  queue_as :default

  def perform(user_id)
    user = User.find_by(id: user_id)
    return unless user&.admin?

    to = ENV["EXPORT_MAIL_TO"].presence || user.email
    Rails.logger.info(
      "[ExportAdminSummaryJob] Sending export to recipient=#{to} (triggered by admin id=#{user.id}" \
      "#{ENV['EXPORT_MAIL_TO'].present? ? ', EXPORT_MAIL_TO override' : ''})"
    )

    dm = ActionMailer::Base.delivery_method
    if dm.to_sym == :file
      loc = Rails.application.config.action_mailer.file_settings[:location]
      Rails.logger.warn(
        "[ExportAdminSummaryJob] Log says \"Delivered mail\" but delivery is :file — nothing is sent over the internet. " \
        "Messages go under #{loc}. Set SENDGRID_API_KEY + SENDGRID_FROM_EMAIL in backend/ticketing_api/.env and restart Sidekiq."
      )
    else
      Rails.logger.info("[ExportAdminSummaryJob] Sending email via #{dm} (SMTP).")
    end

    ExportMailer.admin_summary(user).deliver_now
  end
end
