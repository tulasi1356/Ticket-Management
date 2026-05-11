class AddStartAndEndDateToTickets < ActiveRecord::Migration[8.1]
  def change
    add_column :tickets, :start_date, :date
    add_column :tickets, :end_date, :date
  end
end
