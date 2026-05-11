# frozen_string_literal: true

module Users
  class SearchService
    def self.call(current_user:, params:)
      new(current_user: current_user, params: params).call
    end

    def initialize(current_user:, params:)
      @current_user = current_user
      @params = params
    end

    def call
      query = @params[:query]

      if @params[:project_id].blank? && !@current_user.admin?
        return failure(:forbidden, error: "Forbidden")
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
        if @params[:project_id].present?
          project = Project.find_by(id: @params[:project_id])
          return failure(:not_found, error: "Project not found") unless project

          unless @current_user.admin? || @current_user.projects.exists?(id: project.id)
            return failure(:forbidden, error: "Forbidden")
          end

          member_ids = project.users.ids.map(&:to_s)
          return { ok: true, users: [] } if member_ids.empty?

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
      { ok: true, users: users }
    end

    private

    def failure(status, error:)
      { ok: false, status: status, body: { error: error } }
    end
  end
end
