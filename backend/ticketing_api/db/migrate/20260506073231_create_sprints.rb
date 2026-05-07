class CreateSprints < ActiveRecord::Migration[8.1]
  def change
    create_table :sprints do |t|
      t.string :name
      t.date :start_date
      t.date :end_date
      t.integer :status
      t.references :project, null: false, foreign_key: true

      t.timestamps
    end
  end
end
