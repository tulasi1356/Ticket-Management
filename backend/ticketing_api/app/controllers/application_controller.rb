class ApplicationController < ActionController::API
  private

  def current_user
    return @current_user if defined?(@current_user)

    user_id = request.headers["X-User-Id"].presence
    @current_user = user_id ? User.find_by(id: user_id) : nil
  end

  def require_current_user
    return if current_user

    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def require_admin!
    return if current_user&.admin?

    render json: { error: "Forbidden" }, status: :forbidden
  end
end
