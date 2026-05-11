# frozen_string_literal: true

Rails.application.config.after_initialize do
  next unless Rails.env.development?

  if ENV["SENDGRID_API_KEY"].present?
    Rails.logger.info("[Mailer] SendGrid SMTP enabled — messages leave this machine.")
    if ENV["SENDGRID_FROM_EMAIL"].blank?
      Rails.logger.warn("[Mailer] Set SENDGRID_FROM_EMAIL in .env (verified sender in SendGrid).")
    end
  else
    Rails.logger.warn(
      "[Mailer] SENDGRID_API_KEY unset — mail saved under #{Rails.root.join('tmp/mail')} only. Add SENDGRID_API_KEY + SENDGRID_FROM_EMAIL to .env."
    )
  end
end
