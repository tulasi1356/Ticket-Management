class Ticket < ApplicationRecord
  belongs_to :project
  belongs_to :sprint
  belongs_to :assignee, class_name: "User"

  has_many :comments, dependent: :destroy

  enum :status, { todo: 0, in_progress: 1, test: 2, done: 3 }
  enum :issue_type, { bug: 0, feature: 1, task: 2 }
  enum :priority, { low: 0, medium: 1, high: 2 }

  validates :start_date, presence: true
  validates :end_date, presence: true

  validate :end_date_after_start_date

  private
  
  def end_date_after_start_date
    return if start_date.blank? || end_date.blank?
  end

end
