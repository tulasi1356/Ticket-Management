class Ticket < ApplicationRecord
  belongs_to :project
  belongs_to :sprint
  belongs_to :assignee, class_name: "User"

  enum :status, { todo: 0, in_progress: 1, test: 2, done: 3 }
  enum :issue_type, { bug: 0, feature: 1, task: 2 }
  enum :priority, { low: 0, medium: 1, high: 2 }
end
