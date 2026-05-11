class CommentsController < ApplicationController
  before_action :require_current_user

  def index
    ticket = Ticket.find_by(id: params.require(:ticket_id))
    return render json: { error: "Ticket not found" }, status: :not_found if ticket.nil?
    return render json: { error: "Forbidden" }, status: :forbidden unless ticket_viewable?(ticket)

    comments = ticket.comments.includes(:user).order(:created_at)
    render json: comments.as_json(
      include: { user: { only: [:id, :name, :email] } }
    ), status: :ok
  end

  def create
    attrs = comment_params
    ticket = Ticket.find_by(id: attrs[:ticket_id])
    return render json: { error: "Ticket not found" }, status: :not_found if ticket.nil?
    return render json: { error: "Forbidden" }, status: :forbidden unless ticket_viewable?(ticket)

    comment = ticket.comments.build(
      user: current_user,
      message: attrs[:message],
      attachment_urls: attrs[:attachment_urls] || []
    )

    if comment.save
      render json: comment.as_json(
        include: { user: { only: [:id, :name, :email] } }
      ), status: :created
    else
      render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def ticket_viewable?(ticket)
    current_user.admin? || current_user.projects.exists?(id: ticket.project_id)
  end

  def comment_params
    p = params.permit(:ticket_id, :message, attachment_urls: [])
    p[:attachment_urls] = [] if p[:attachment_urls].nil?
    p
  end
end
