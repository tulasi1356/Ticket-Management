class SprintsController < ApplicationController

    before_action :require_current_user

    def create
        result = Sprints::CreateService.call(current_user: current_user, params: params)
        if result[:ok]
            render json: result[:sprint], status: :created
        else
            render json: result[:body], status: result[:status]
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
end