# frozen_string_literal: true

namespace :redis do
  desc "Check Redis (same REDIS_URL as Sidekiq). Usage: bin/rails redis:ping"
  task ping: :environment do
    require "redis-client"

    url = ENV.fetch("REDIS_URL", "redis://localhost:6379/0")
    client = RedisClient.config(url: url).new_client
    reply = client.call("PING")
    puts "OK — #{url} => #{reply}"
  rescue StandardError => e
    warn "FAILED — #{e.class}: #{e.message}"
    warn "Install/start Redis: brew install redis && brew services start redis"
    exit 1
  end
end
