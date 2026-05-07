class TicketsController < ApplicationController

    before_action :require_current_user

    def create
        project = Project.find_by(id: params[:project_id])
        if project.nil?
            return render json: { error: "Project not found" }, status: :not_found
        end

        if !current_user.admin? && !current_user.projects.exists?(id: project.id)
            return render json: { error: "Forbidden" }, status: :forbidden
        end

        ticket = Ticket.new(
            title: params[:title],
            description: params[:description],
            status: params[:status],
            issue_type: params[:issue_type],
            priority: params[:priority],
            project_id: params[:project_id],
            sprint_id: params[:sprint_id],
            assignee_id: params[:assignee_id]
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
    
end