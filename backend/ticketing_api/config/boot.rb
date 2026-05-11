ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)

require "bundler/setup" # Set up gems listed in the Gemfile.

# Load .env from the app root before mailer / Sidekiq read ENV (cwd may differ from Rails.root).
rails_root = File.expand_path("..", __dir__)
require "dotenv"
env_paths = [File.join(rails_root, ".env"), File.join(rails_root, ".env.local")].select { |p| File.exist?(p) }
Dotenv.load(*env_paths) if env_paths.any?

require "bootsnap/setup" # Speed up boot time by caching expensive operations.
