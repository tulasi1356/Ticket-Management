class SprintsController < ApplicationController

    before_action :require_current_user

    def create
        project = Project.find_by(id: params[:project_id])
        if project.nil?
            return render json: { error: "Project not found" }, status: :not_found
        end

        if !current_user.admin? && !current_user.projects.exists?(id: project.id)
            return render json: { error: "Forbidden" }, status: :forbidden
        end

        sprint = Sprint.new(sprint_params)
        if sprint.start_date > Date.today
            sprint.status = :planned
        elsif sprint.start_date <= Date.today && sprint.end_date >= Date.today
            sprint.status = :active
        elsif sprint.end_date < Date.today
            sprint.status = :completed
        end
        if sprint.save
            render json: sprint, status: :created
        else
            render json: { errors: sprint.errors.full_messages }, status: :unprocessable_entity
        end
    end


    def index
        sprints =
            if current_user.admin?
                Sprint.all
            else
                Sprint.where(project_id: current_user.projects.select(:id))
            end

        render json: sprints, status: :ok
    end

    private
    def sprint_params
        params.permit(:name, :start_date, :end_date, :project_id)
    end
end