terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # For a real project, use S3 backend:
  # backend "s3" {
  #   bucket         = "svg-spawn-terraform-state"
  #   key            = "dev/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "svg-spawn-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "svg-spawn"
      Environment = "dev"
      ManagedBy   = "terraform"
    }
  }
}

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "svg-spawn"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "svgspawn"
}

variable "gemini_api_key" {
  description = "Google Gemini API key"
  type        = string
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Random password for RDS
# -----------------------------------------------------------------------------

resource "random_password" "db_password" {
  length  = 32
  special = false
}

# -----------------------------------------------------------------------------
# VPC — use default VPC for dev (cheapest)
# -----------------------------------------------------------------------------

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# -----------------------------------------------------------------------------
# Security Group for RDS
# -----------------------------------------------------------------------------

resource "aws_security_group" "db" {
  name        = "${var.project_name}-dev-db"
  description = "Allow PostgreSQL access from within the VPC"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.default.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# -----------------------------------------------------------------------------
# RDS PostgreSQL (dev: single-AZ, smallest instance, no Multi-AZ)
# -----------------------------------------------------------------------------

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-dev"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_db_instance" "postgres" {
  identifier     = "${var.project_name}-dev"
  engine         = "postgres"
  engine_version = "16.4"
  instance_class = "db.t4g.micro"

  allocated_storage     = 20
  max_allocated_storage = 50
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = "svgspawn"
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]

  multi_az            = false
  publicly_accessible = false
  skip_final_snapshot = true

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  deletion_protection = false
}

# -----------------------------------------------------------------------------
# S3 Bucket for SVG artifacts
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "svg_artifacts" {
  bucket = "${var.project_name}-dev-artifacts-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "svg_artifacts" {
  bucket = aws_s3_bucket.svg_artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "svg_artifacts" {
  bucket = aws_s3_bucket.svg_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "svg_artifacts" {
  bucket = aws_s3_bucket.svg_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "svg_artifacts" {
  bucket = aws_s3_bucket.svg_artifacts.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

data "aws_caller_identity" "current" {}

# -----------------------------------------------------------------------------
# SQS Queue for job processing
# -----------------------------------------------------------------------------

resource "aws_sqs_queue" "generation_jobs" {
  name                       = "${var.project_name}-dev-generation-jobs"
  visibility_timeout_seconds = 600   # 10 min — Gemini calls can be slow
  message_retention_seconds  = 86400 # 1 day
  receive_wait_time_seconds  = 20    # long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.generation_jobs_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "generation_jobs_dlq" {
  name                      = "${var.project_name}-dev-generation-jobs-dlq"
  message_retention_seconds = 604800 # 7 days
}

# -----------------------------------------------------------------------------
# Secrets Manager — store sensitive config
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.project_name}/dev/app-secrets"
  recovery_window_in_days = 0 # dev: allow immediate deletion
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id

  secret_string = jsonencode({
    GEMINI_API_KEY   = var.gemini_api_key
    DATABASE_URL     = "postgresql://${aws_db_instance.postgres.username}:${random_password.db_password.result}@${aws_db_instance.postgres.endpoint}/${var.db_name}"
    S3_BUCKET        = aws_s3_bucket.svg_artifacts.id
    SQS_QUEUE_URL    = aws_sqs_queue.generation_jobs.url
    GEMINI_MODEL_ID  = "gemini-2.5-pro"
    MAX_CREDITS_FREE = "50"
  })
}

# -----------------------------------------------------------------------------
# IAM Role for the application (ECS task, Lambda, or EC2)
# -----------------------------------------------------------------------------

resource "aws_iam_role" "app" {
  name = "${var.project_name}-dev-app"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = [
          "ecs-tasks.amazonaws.com",
          "lambda.amazonaws.com"
        ]
      }
    }]
  })
}

resource "aws_iam_role_policy" "app_policy" {
  name = "${var.project_name}-dev-app-policy"
  role = aws_iam_role.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.svg_artifacts.arn,
          "${aws_s3_bucket.svg_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = [
          aws_sqs_queue.generation_jobs.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.app_secrets.arn
        ]
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "database_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.postgres.db_name
}

output "s3_bucket" {
  description = "S3 bucket for SVG artifacts"
  value       = aws_s3_bucket.svg_artifacts.id
}

output "sqs_queue_url" {
  description = "SQS queue URL for generation jobs"
  value       = aws_sqs_queue.generation_jobs.url
}

output "sqs_dlq_url" {
  description = "SQS dead-letter queue URL"
  value       = aws_sqs_queue.generation_jobs_dlq.url
}

output "secrets_arn" {
  description = "Secrets Manager ARN"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "app_role_arn" {
  description = "IAM role ARN for the application"
  value       = aws_iam_role.app.arn
}

output "database_url" {
  description = "Full PostgreSQL connection string"
  value       = "postgresql://${aws_db_instance.postgres.username}:${random_password.db_password.result}@${aws_db_instance.postgres.endpoint}/${var.db_name}"
  sensitive   = true
}
