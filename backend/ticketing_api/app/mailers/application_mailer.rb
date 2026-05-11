class ApplicationMailer < ActionMailer::Base
  default from: -> { ENV["SENDGRID_FROM_EMAIL"].presence || "ticketing@example.com" }
  layout "mailer"
end
