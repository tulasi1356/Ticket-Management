class AddAttachmentUrlsToTickets < ActiveRecord::Migration[8.1]
  def change
    add_column :tickets, :attachment_urls, :json, default: []
  end
end
