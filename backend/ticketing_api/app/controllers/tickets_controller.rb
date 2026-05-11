class TicketsController < ApplicationController
    include Pagy::Method

    before_action :require_current_user
    before_action :require_admin!, only: [:export]

    def create
        result = Tickets::CreateService.call(current_user: current_user, params: params)
        if result[:ok]
            ticket = result[:ticket]
            render json: ticket.as_json(
                include: { assignee: { only: [:id, :name, :email, :role] } }
            ), status: :created
        else
            render json: result[:body], status: result[:status]
        end
    end

    def update
        result = Tickets::UpdateService.call(
            current_user: current_user,
            ticket_id: params[:id],
            permitted_attrs: ticket_update_params
        )
        if result[:ok]
            ticket = result[:ticket]
            render json: ticket.as_json(
                include: { assignee: { only: [:id, :name, :email, :role] } }
            ), status: :ok
        else
            render json: result[:body], status: result[:status]
        end
    end

    def index
        result = Tickets::BoardQueryService.call(current_user: current_user, params: params)
        unless result[:ok]
            render json: result[:body], status: result[:status]
            return
        end

        page = params[:page].presence&.to_i
        page = 1 if page.nil? || page < 1

        @pagy, records = pagy(:offset, result[:relation], page: page, limit: 20)

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
            stats: result[:stats]
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
