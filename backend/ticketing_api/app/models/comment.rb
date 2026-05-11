class Comment < ApplicationRecord
  belongs_to :ticket
  belongs_to :user

  validate :message_or_attachments

  private

  def message_or_attachments
    urls = Array(attachment_urls).flatten.compact.map { |u| u.to_s.strip }.reject(&:blank?)
    if message.to_s.strip.blank? && urls.empty?
      errors.add(:base, "Add a message or at least one attachment")
    end
  end
end
