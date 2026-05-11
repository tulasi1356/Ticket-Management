# frozen_string_literal: true

class ExportMailer < ApplicationMailer
  def admin_summary(user)
    @body = AdminExportSummary.build
    ts = Time.zone.now.strftime("%Y%m%d-%H%M%S")
    attachments["ticket-export-#{ts}.csv"] = {
      mime_type: "text/csv; charset=utf-8",
      content: AdminExportSummary.csv
    }
    to = ENV["EXPORT_MAIL_TO"].presence || user.email
    mail(
      to: to,
      subject: "Ticket export — projects, sprints, and ticket statuses (CSV attached)"
    )
  end
end
