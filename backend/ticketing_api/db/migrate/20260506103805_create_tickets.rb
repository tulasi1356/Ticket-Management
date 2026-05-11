class CreateTickets < ActiveRecord::Migration[8.1]
  def change
    create_table :tickets do |t|
      t.string :title
      t.text :description
      t.integer :status
      t.integer :issue_type
      t.integer :priority
      t.date :start_date
      t.date :end_date
      t.references :project, null: false, foreign_key: true
      t.references :sprint, null: false, foreign_key: true
      t.references :assignee, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end
