class User < ApplicationRecord
    include Elasticsearch::Model
    include Elasticsearch::Model::Callbacks

    index_name "users_#{Rails.env}"

    def as_indexed_json(_options = {})
        as_json(only: [:name, :email])
    end


    has_secure_password

    enum :role, { normal: 0, admin: 1 }, default: :normal


    has_many :project_users, dependent: :destroy
    has_many :projects, through: :project_users

    has_many :assigned_tickets, class_name: "Ticket", foreign_key: "assignee_id"
    has_many :comments

    validates :name, presence: true
    validates :email, presence: true, uniqueness: true

    settings do
        mappings dynamic: false do
            indexes :name, type: :search_as_you_type
            indexes :email, type: :search_as_you_type
        end
    end

end
