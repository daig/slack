variable "db_password" {
  description = "Password for PostgreSQL database"
  type        = string
  sensitive   = true  # This marks the variable as sensitive in logs
} 