class TicketsController < ApplicationController
    include Pagy::Method

    before_action :require_current_user
    before_action :require_admin!, only: [:export]

    def create
        project = Project.find_by(id: params[:project_id])
        if project.nil?
            return render json: { error: "Project not found" }, status: :not_found
        end

        if !current_user.admin? && !current_user.projects.exists?(id: project.id)
            return render json: { error: "Forbidden" }, status: :forbidden
        end

        if params[:assignee_id].present? && !project.users.exists?(id: params[:assignee_id])
            return render json: { error: "Assignee must be a member of this project" }, status: :unprocessable_entity
        end

        ticket = Ticket.new(
            title: params[:title],
            description: params[:description],
            status: params[:status],
            issue_type: params[:issue_type],
            priority: params[:priority],
            project_id: params[:project_id],
            sprint_id: params[:sprint_id],
            assignee_id: params[:assignee_id],
            start_date: params[:start_date],
            end_date: params[:end_date]
        )
        if ticket.save
            ticket.reload
            render json: ticket.as_json(
                include: { assignee: { only: [:id, :name, :email, :role] } }
            ), status: :created
        else
            render json: { errors: ticket.errors.full_messages }, status: :unprocessable_entity
        end
    end

    def update
        ticket = Ticket.find_by(id: params[:id])
        if ticket.nil?
            return render json: { error: "Ticket not found" }, status: :not_found
        end

        if !current_user.admin? && !current_user.projects.exists?(id: ticket.project_id)
            return render json: { error: "Forbidden" }, status: :forbidden
        end

        if params[:assignee_id].present? && !ticket.project.users.exists?(id: params[:assignee_id])
            return render json: { error: "Assignee must be a member of this project" }, status: :unprocessable_entity
        end

        attrs = ticket_update_params
        if ticket.update(attrs)
            ticket.reload
            render json: ticket.as_json(
                include: { assignee: { only: [:id, :name, :email, :role] } }
            ), status: :ok
        else
            render json: { errors: ticket.errors.full_messages }, status: :unprocessable_entity
        end
    end

    def index
        relation = board_tickets_relation
        return if relation.nil?

        stats = ticket_stats_for(relation)
        page = params[:page].presence&.to_i
        page = 1 if page.nil? || page < 1

        @pagy, records = pagy(:offset, relation, page: page, limit: 20)

        render json: {
            tickets: records.as_json(
                include: { assignee: { only: [:id, :name, :email] } }
            ),
            meta: {
                page: @pagy.page,
                per_page: @pagy.limit,
                total: @pagy.count,
                total_pages: @pagy.pages,
                has_more: @pagy.page < @pagy.pages
            },
            stats: stats
        }, status: :ok
    end

    def export
        job = ExportAdminSummaryJob.perform_later(current_user.id)
        render json: {
            message: "Export queued. You will receive an email with a CSV attachment shortly.",
            job_id: job.job_id
        }, status: :accepted
    end

    private

    def board_tickets_relation
        project_id = params[:project_id].presence&.to_i
        if project_id.blank? || project_id <= 0
            render json: { error: "project_id is required" }, status: :unprocessable_entity
            return nil
        end

        unless Project.exists?(id: project_id)
            render json: { error: "Project not found" }, status: :not_found
            return nil
        end

        unless current_user.admin? || current_user.projects.exists?(id: project_id)
            render json: { error: "Forbidden" }, status: :forbidden
            return nil
        end

        scope = Ticket.includes(:assignee).where(project_id: project_id)

        case (params[:board_view].presence || "sprint").to_s
        when "sprint"
            sprint_id = params[:sprint_id].presence&.to_i
            if sprint_id.blank? || sprint_id <= 0
                render json: { error: "sprint_id is required for sprint board_view" }, status: :unprocessable_entity
                return nil
            end
            unless Sprint.exists?(id: sprint_id, project_id: project_id)
                render json: { error: "Sprint not found for this project" }, status: :not_found
                return nil
            end
            scope = scope.where(sprint_id: sprint_id)
        when "all"
            # already scoped to project
        when "mine"
            scope = scope.where(assignee_id: current_user.id)
        when "backlog"
            scope = scope.where(sprint_id: nil)
        else
            render json: { error: "Invalid board_view" }, status: :unprocessable_entity
            return nil
        end

        scope = apply_ticket_filters(scope, project_id)
        scope.order(priority: :desc, id: :asc)
    end

    def apply_ticket_filters(scope, project_id)
        if params[:q].present?
            term = "%#{ActiveRecord::Base.sanitize_sql_like(params[:q].to_s.downcase)}%"
            scope = scope.where("LOWER(tickets.title) LIKE ?", term)
        end

        priorities = enum_tokens_param(params[:priorities], Ticket.priorities.keys)
        scope = scope.where(priority: priorities) if priorities.any?

        statuses = enum_tokens_param(params[:statuses], Ticket.statuses.keys)
        scope = scope.where(status: statuses) if statuses.any?

        assignee_ids = integer_list_param(params[:assignee_ids])
        if assignee_ids.any?
            allowed = Project.find(project_id).user_ids
            filtered = assignee_ids & allowed
            scope = scope.where(assignee_id: filtered)
        end

        from = params[:date_from].presence
        to = params[:date_to].presence
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

    def ticket_stats_for(relation)
        {
            total: relation.count,
            todo: relation.where(status: :todo).count,
            done: relation.where(status: :done).count,
            high_priority: relation.where(priority: :high).count
        }
    end

    def ticket_update_params
        params.permit(
            :title,
            :description,
            :status,
            :priority,
            :issue_type,
            :assignee_id,
            :start_date,
            :end_date,
            attachment_urls: []
        )
    end
end