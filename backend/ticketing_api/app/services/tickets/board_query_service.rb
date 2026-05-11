# frozen_string_literal: true

module Tickets
  class BoardQueryService
    def self.call(current_user:, params:)
      new(current_user: current_user, params: params).call
    end

    def initialize(current_user:, params:)
      @current_user = current_user
      @params = params
    end

    def call
      relation = build_relation
      return relation if relation[:ok] == false

      rel = relation[:relation]
      { ok: true, relation: rel, stats: stats_for(rel) }
    end

    private

    def build_relation
      project_id = @params[:project_id].presence&.to_i
      if project_id.blank? || project_id <= 0
        return failure(:unprocessable_entity, error: "project_id is required")
      end

      unless Project.exists?(id: project_id)
        return failure(:not_found, error: "Project not found")
      end

      unless @current_user.admin? || @current_user.projects.exists?(id: project_id)
        return failure(:forbidden, error: "Forbidden")
      end

      scope = Ticket.includes(:assignee).where(project_id: project_id)

      case (@params[:board_view].presence || "sprint").to_s
      when "sprint"
        sprint_id = @params[:sprint_id].presence&.to_i
        if sprint_id.blank? || sprint_id <= 0
          return failure(:unprocessable_entity, error: "sprint_id is required for sprint board_view")
        end
        unless Sprint.exists?(id: sprint_id, project_id: project_id)
          return failure(:not_found, error: "Sprint not found for this project")
        end
        scope = scope.where(sprint_id: sprint_id)
      when "all"
        # scoped to project only
      when "mine"
        scope = scope.where(assignee_id: @current_user.id)
      when "backlog"
        scope = scope.where(sprint_id: nil)
      else
        return failure(:unprocessable_entity, error: "Invalid board_view")
      end

      scope = apply_ticket_filters(scope, project_id)
      { ok: true, relation: scope.order(priority: :desc, id: :asc) }
    end

    def apply_ticket_filters(scope, project_id)
      if @params[:q].present?
        term = "%#{ActiveRecord::Base.sanitize_sql_like(@params[:q].to_s.downcase)}%"
        scope = scope.where("LOWER(tickets.title) LIKE ?", term)
      end

      priorities = enum_tokens_param(@params[:priorities], Ticket.priorities.keys)
      scope = scope.where(priority: priorities) if priorities.any?

      statuses = enum_tokens_param(@params[:statuses], Ticket.statuses.keys)
      scope = scope.where(status: statuses) if statuses.any?

      assignee_ids = integer_list_param(@params[:assignee_ids])
      if assignee_ids.any?
        allowed = Project.find(project_id).user_ids
        filtered = assignee_ids & allowed
        scope = scope.where(assignee_id: filtered)
      end

      from = @params[:date_from].presence
      to = @params[:date_to].presence
      if from.present? || to.present?
        range_start = from || "1000-01-01"
        range_end = to || "9999-12-31"
        scope = scope.where.not(start_date: nil).where.not(end_date: nil)
        scope = scope.where(
          "NOT (tickets.end_date < ? OR tickets.start_date > ?)",
          range_start,
          range_end
        )
      end

      scope
    end

    def stats_for(relation)
      {
        total: relation.count,
        todo: relation.where(status: :todo).count,
        done: relation.where(status: :done).count,
        high_priority: relation.where(priority: :high).count
      }
    end

    def enum_tokens_param(raw, allowed_keys)
      keys = allowed_keys.map(&:to_s)
      tokens = coalesce_string_list(raw).map(&:strip).map(&:downcase).reject(&:blank?)
      tokens.uniq.select { |t| keys.include?(t) }
    end

    def coalesce_string_list(raw)
      case raw
      when Array
        raw.flat_map { |v| v.to_s.split(",") }
      when String
        raw.split(",")
      else
        []
      end
    end

    def integer_list_param(raw)
      coalesce_string_list(raw).map { |s| s.strip.to_i }.reject { |n| n <= 0 }.uniq
    end

    def failure(status, error:)
      { ok: false, status: status, body: { error: error } }
    end
  end
end
