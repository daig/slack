# Provider configuration
provider "aws" {
  region = "eu-north-1"  # Changed to Stockholm region
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "dai-slack-app-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "dai-slack-app-igw"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "eu-north-1a"  # Changed to match new region
  map_public_ip_on_launch = true

  tags = {
    Name = "dai-slack-app-public"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "dai-slack-app-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security Group
resource "aws_security_group" "ec2" {
  name        = "ec2-security-group"
  description = "Security group for EC2 instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${chomp(data.http.myip.response_body)}/32"]  # SSH from your IP
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # HTTP from anywhere
  }

  ingress {
    from_port   = 5001
    to_port     = 5001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # GraphQL endpoint access from anywhere
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "dai-slack-app-ec2-sg"
  }
}

# Get current IP for security group
data "http" "myip" {
  url = "http://ipv4.icanhazip.com"
}

# Create AWS key pair from local public key
resource "aws_key_pair" "deployer" {
  key_name   = "dai-slack-app-deployer-key"
  public_key = file("~/.ssh/id_rsa.pub")  # Path to your public key
}

# EC2 Instance
resource "aws_instance" "app" {
  ami           = "ami-0989fb15ce71ba39e"  # Changed to Ubuntu 22.04 LTS AMI for eu-north-1
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  key_name      = aws_key_pair.deployer.key_name

  root_block_device {
    volume_size = 20
    volume_type = "gp2"
  }

  user_data = templatefile("${path.module}/user_data.tftpl", {
    env_file_contents = file("${path.module}/../.env")
  })

  tags = {
    Name = "dai-slack-app-server"
  }
}

output "public_ip" {
  value = aws_instance.app.public_ip
}

# S3 Bucket for file uploads
resource "aws_s3_bucket" "uploads" {
  bucket = "dai-slack-app-uploads"
}

# Disable block public access settings
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket policy to allow public read access
resource "aws_s3_bucket_policy" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.uploads.arn}/*"
      },
    ]
  })

  # Wait for public access block to be disabled first
  depends_on = [aws_s3_bucket_public_access_block.uploads]
}

# Enable versioning
resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Configure CORS for the bucket
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]  # Replace with your frontend domain in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Output the bucket name
output "uploads_bucket_name" {
  value = aws_s3_bucket.uploads.id
}