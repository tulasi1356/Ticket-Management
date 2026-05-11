# Idempotent bootstrap: ensure the admin account exists.
# Run: bin/rails db:seed
#
# To wipe all data and recreate only admin, uncomment the transaction block below.

admin_email = "adminticketingsystem@yopmail.com"
admin_password = "Admin@123"

# ActiveRecord::Base.transaction do
#   Comment.delete_all
#   Ticket.delete_all
#   Sprint.delete_all
#   ProjectUser.delete_all
#   Project.delete_all
#   User.delete_all
# end

User.find_or_create_by!(email: admin_email) do |u|
  u.name = "Admin"
  u.password = admin_password
  u.role = :admin
end
