namespace :elasticsearch do
  desc "Recreate and reindex User documents into Elasticsearch"
  task reindex_users: :environment do
    client = User.__elasticsearch__.client
    index = User.index_name

    puts "Using index: #{index}"
    begin
      client.indices.delete(index: index)
      puts "Deleted index: #{index}"
    rescue StandardError => e
      puts "Index delete skipped: #{e.class}: #{e.message}"
    end

    User.__elasticsearch__.create_index!(force: true)
    puts "Created index: #{index}"

    imported = User.import(force: true)
    puts "Imported: #{imported.inspect}"

    client.indices.refresh(index: index)
    puts "Refreshed index: #{index}"
  end
end

