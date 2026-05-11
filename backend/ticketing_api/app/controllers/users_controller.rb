class UsersController < ApplicationController

    before_action :require_current_user, except: [:create, :find_by_email]
    before_action :require_admin!, only: [:index, :update, :destroy]

    def index
        users = User.all
        render json: users, status: :ok
    end

    def find_by_email
        user = User.find_by(email: params[:email])
        if user
            render json: user, status: :ok
        else
            render json: { error: "User not found" }, status: :not_found
        end
    end
    
    def create
        user = User.new(
            name: params[:name],
            email: params[:email],
            password: params[:password],
            role: resolved_role
        )
        if user.save
            render json: user, status: :created
        else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
    end

    def update
        user = User.find(params[:id])
        if user.update(name: params[:name], email: params[:email], password: params[:password], role: params[:role])
            render json: user, status: :ok
        else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
    end


    def search
        query = params[:query]

        # Without a project scope, only admins may search the full directory (e.g. assigning users to a project).
        if params[:project_id].blank? && !current_user.admin?
            return render json: { error: "Forbidden" }, status: :forbidden
        end

        es_query =
          if query.present?
            {
              multi_match: {
                query: query,
                type: "bool_prefix",
                fields: [
                  "name^2",
                  "name._2gram",
                  "name._3gram",
                  "email",
                  "email._2gram",
                  "email._3gram"
                ]
              }
            }
          else
            { match_all: {} }
          end

        scoped_query =
          if params[:project_id].present?
            project = Project.find_by(id: params[:project_id])
            unless project
              return render json: { error: "Project not found" }, status: :not_found
            end

            unless current_user.admin? || current_user.projects.exists?(id: project.id)
              return render json: { error: "Forbidden" }, status: :forbidden
            end

            member_ids = project.users.ids.map(&:to_s)
            return render json: [], status: :ok if member_ids.empty?

            {
              bool: {
                must: [es_query],
                filter: [{ ids: { values: member_ids } }]
              }
            }
          else
            es_query
          end

        response = User.search(query: scoped_query)

        users = response.records.to_a
        render json: users.as_json(only: [:id, :name, :email]), status: :ok
    end

    def destroy
        user = User.find(params[:id])
        if user.destroy
            render json: { message: "User deleted successfully" }, status: :ok
        else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
    end

    private

    # Default normal (0). Bootstrap admin emails are always admin. Otherwise explicit
    # admin (1 or "admin") maps to admin (1).
    def resolved_role
        email = params[:email].to_s.strip.downcase
        return :admin if %w[admin@gmail.com admin@yopmail.com].include?(email)

        r = params[:role]
        return :normal if r.blank?

        (r.to_s == "admin" || r.to_i == 1) ? :admin : :normal
    end

    def user_params
        params.permit(:name, :email, :password)
    end

end
