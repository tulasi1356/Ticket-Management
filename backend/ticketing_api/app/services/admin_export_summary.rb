# frozen_string_literal: true

require "csv"

class AdminExportSummary
  def self.build
    parts = []
    parts << "Ticket system export"
    parts << "Generated at: #{Time.zone.now.iso8601}"
    parts << ""
    parts << "A CSV spreadsheet is attached: all projects, sprints, and tickets with statuses."
    parts << ""
    parts << "=== All users ==="
    User.find_each do |u|
      parts << "  id=#{u.id}  #{u.email}  #{u.name}  role=#{u.role}"
    end
    parts << ""
    parts << "=== Tickets (summary) ==="
    parts << "project | sprint | ticket | status | priority | assignee | title"
    Ticket.includes(:project, :sprint, :assignee).find_each do |t|
      p = t.project
      s = t.sprint
      a = t.assignee
      parts << [
        p.name,
        s.name,
        "##{t.id}",
        t.status,
        t.priority,
        a.name,
        t.title.truncate(80)
      ].join(" | ")
    end
    parts << ""

    Project.includes(:sprints).find_each do |project|
      parts << "=== Project: #{project.name} (id=#{project.id}) ==="
      parts << "Description: #{project.description}"
      parts << ""

      counts = Ticket.where(project_id: project.id).group(:status).count
      parts << "Tickets by status:"
      Ticket.statuses.each_key do |status|
        int_key = Ticket.statuses[status]
        n = counts[int_key] || 0
        parts << "  #{status}: #{n}"
      end
      parts << ""

      parts << "Sprints:"
      project.sprints.order(:id).each do |sp|
        parts << "  - #{sp.name} | #{sp.start_date}..#{sp.end_date} | sprint_status=#{sp.status}"
      end
      parts << ""
    end

    parts.join("\n")
  end

  def self.csv
    CSV.generate(headers: true, write_headers: true) do |csv|
      csv << %w[
        project_id
        project_name
        sprint_id
        sprint_name
        sprint_status
        sprint_start_date
        sprint_end_date
        ticket_id
        title
        ticket_status
        priority
        issue_type
        assignee_id
        assignee_name
        assignee_email
        ticket_start_date
        ticket_end_date
      ]

      Ticket.includes(:project, :sprint, :assignee).find_each do |t|
        sp = t.sprint
        pr = t.project
        a = t.assignee
        csv << [
          pr.id,
          pr.name,
          sp.id,
          sp.name,
          sp.status,
          sp.start_date&.iso8601,
          sp.end_date&.iso8601,
          t.id,
          t.title,
          t.status,
          t.priority,
          t.issue_type,
          a.id,
          a.name,
          a.email,
          t.start_date&.iso8601,
          t.end_date&.iso8601
        ]
      end
    end
  end
end
