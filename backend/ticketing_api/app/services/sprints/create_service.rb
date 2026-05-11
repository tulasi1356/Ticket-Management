# frozen_string_literal: true

module Sprints
  class CreateService
    def self.call(current_user:, params:)
      new(current_user: current_user, params: params).call
    end

    def initialize(current_user:, params:)
      @current_user = current_user
      @params = params
    end

    def call
      permitted = @params.permit(:name, :start_date, :end_date, :project_id)
      project = Project.find_by(id: permitted[:project_id])
      return failure(:not_found, error: "Project not found") if project.nil?
      return failure(:forbidden, error: "Forbidden") unless @current_user.admin? || @current_user.projects.exists?(id: project.id)

      sprint = Sprint.new(permitted)
      sprint.status = derived_status(sprint)

      if sprint.save
        { ok: true, sprint: sprint }
      else
        failure(:unprocessable_entity, errors: sprint.errors.full_messages)
      end
    end

    private

    def derived_status(sprint)
      today = Date.today
      if sprint.start_date > today
        :planned
      elsif sprint.start_date <= today && sprint.end_date >= today
        :active
      elsif sprint.end_date < today
        :completed
      else
        :planned
      end
    end

    def failure(status, error: nil, errors: nil)
      body = {}
      body[:error] = error if error
      body[:errors] = errors if errors
      { ok: false, status: status, body: body }
    end
  end
end
