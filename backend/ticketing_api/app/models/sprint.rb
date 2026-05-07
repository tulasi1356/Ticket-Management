class Sprint < ApplicationRecord
  belongs_to :project

  has_many :tickets, dependent: :destroy

  enum :status, {
    planned: 0,
    active: 1,
    completed: 2
  }

  validates :name, presence: true
  validates :start_date, presence: true
  validates :end_date, presence: true

  validate :end_date_after_start_date

  private

  def end_date_after_start_date
    return if start_date.blank? || end_date.blank?

    if end_date < start_date
      errors.add(:end_date, "must be after start date")
    end
  end

end
