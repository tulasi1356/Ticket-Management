class TicketsController < ApplicationController

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
        tickets =
            if current_user.admin?
                Ticket.includes(:assignee).order(:id)
            else
                Ticket.includes(:assignee)
                      .where(project_id: current_user.projects.select(:id))
                      .order(:id)
            end

        render json: tickets.as_json(
            include: { assignee: { only: [:id, :name, :email] } }
        ), status: :ok
    end

    def export
        job = ExportAdminSummaryJob.perform_later(current_user.id)
        render json: {
            message: "Export queued. You will receive an email with a CSV attachment shortly.",
            job_id: job.job_id
        }, status: :accepted
    end

    private

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