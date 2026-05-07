class UsersController < ApplicationController

    before_action :require_current_user, except: [:create, :find_by_email, :search]
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
      
        response = User.search({ query: es_query })
      
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

    # Default normal (0). admin@gmail.com is always admin. Otherwise explicit
    # admin (1 or "admin") maps to admin (1).
    def resolved_role
        email = params[:email].to_s.strip.downcase
        return :admin if email == "admin@gmail.com"

        r = params[:role]
        return :normal if r.blank?

        (r.to_s == "admin" || r.to_i == 1) ? :admin : :normal
    end

    def user_params
        params.permit(:name, :email, :password)
    end

end
