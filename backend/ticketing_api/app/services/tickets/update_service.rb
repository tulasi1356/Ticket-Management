# frozen_string_literal: true

module Tickets
  class UpdateService
    def self.call(current_user:, ticket_id:, permitted_attrs:)
      new(current_user: current_user, ticket_id: ticket_id, permitted_attrs: permitted_attrs).call
    end

    def initialize(current_user:, ticket_id:, permitted_attrs:)
      @current_user = current_user
      @ticket_id = ticket_id
      @permitted_attrs = permitted_attrs
    end

    def call
      ticket = Ticket.find_by(id: @ticket_id)
      return failure(:not_found, error: "Ticket not found") if ticket.nil?
      return failure(:forbidden, error: "Forbidden") unless @current_user.admin? || @current_user.projects.exists?(id: ticket.project_id)

      assignee_id = @permitted_attrs[:assignee_id]
      if assignee_id.present? && !ticket.project.users.exists?(id: assignee_id)
        return failure(:unprocessable_entity, error: "Assignee must be a member of this project")
      end

      if ticket.update(@permitted_attrs)
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
