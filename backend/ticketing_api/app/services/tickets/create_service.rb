# frozen_string_literal: true

module Tickets
  class CreateService
    def self.call(current_user:, params:)
      new(current_user: current_user, params: params).call
    end

    def initialize(current_user:, params:)
      @current_user = current_user
      @params = params
    end

    def call
      attrs = @params.permit(
        :title,
        :description,
        :status,
        :issue_type,
        :priority,
        :project_id,
        :sprint_id,
        :assignee_id,
        :start_date,
        :end_date
      )

      project = Project.find_by(id: attrs[:project_id])
      return failure(:not_found, error: "Project not found") if project.nil?
      return failure(:forbidden, error: "Forbidden") unless @current_user.admin? || @current_user.projects.exists?(id: project.id)

      if attrs[:assignee_id].present? && !project.users.exists?(id: attrs[:assignee_id])
        return failure(:unprocessable_entity, error: "Assignee must be a member of this project")
      end

      ticket = Ticket.new(attrs)
      if ticket.save
        ticket.reload
        { ok: true, ticket: ticket }
      else
        failure(:unprocessable_entity, errors: ticket.errors.full_messages)
      end
    end

    private

    def failure(status, error: nil, errors: nil)
      body = {}
      body[:error] = error if error
      body[:errors] = errors if errors
      { ok: false, status: status, body: body }
    end
  end
end
