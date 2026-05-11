class ProjectsController < ApplicationController

    before_action :require_current_user
    before_action :require_admin!, only: [:create, :assign_users_to_project]

    def index
        projects =
            if current_user.admin?
                Project.all
            else
                current_user.projects
            end

        render json: projects.as_json(
            include: { users: { only: [:id, :name, :email, :role] } }
        ), status: :ok
    end

    def create
        project = Project.new(project_params)
        if project.save
            render json: project.as_json(
                include: { users: { only: [:id, :name, :email, :role] } }
            ), status: :created
        else
            render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
        end
    
    end


    def assign_users_to_project
        p = assign_users_params
        project = Project.find(p[:id])
        ids = Array(p[:user_ids]).flatten.map(&:to_i).reject(&:zero?).uniq
        users = User.where(id: ids)
        if project.update(user_ids: users.pluck(:id))
            project.reload
            render json: project.as_json(
                include: { users: { only: [:id, :name, :email, :role] } }
            ), status: :ok
        else
            render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
        end
    end



    def edit_project
        project = Project.find(params[:id])
        if project.update(name: params[:name], description: params[:description])
            render json: project.as_json(
                include: { users: { only: [:id, :name, :email, :role] } }
            ), status: :ok
        else
            render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
        end
    end

    def get_project
        project = Project.find(params[:id])
        render json: project.as_json(
            include: { users: { only: [:id, :name, :email, :role] } }
        ), status: :ok
    end


    def destroy_project
        project = Project.find(params[:id])
        if project.destroy
            render json: { message: "Project deleted successfully" }, status: :ok
        else
            render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
        end
    end

    private

    def project_params
        params.permit(:name, :description)
    end

    def assign_users_params
        params.permit(:id, user_ids: [])
    end
end