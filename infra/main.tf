# Provider configuration
provider "aws" {
  region = "us-west-2"  # Change as needed
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "slack-app-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "slack-app-igw"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-2a"
  map_public_ip_on_launch = true

  tags = {
    Name = "slack-app-public"
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
    Name = "slack-app-public-rt"
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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "slack-app-ec2-sg"
  }
}

# Get current IP for security group
data "http" "myip" {
  url = "http://ipv4.icanhazip.com"
}

# Create AWS key pair from local public key
resource "aws_key_pair" "deployer" {
  key_name   = "slack-app-deployer-key"
  public_key = file("~/.ssh/id_rsa.pub")  # Path to your public key
}

# EC2 Instance
resource "aws_instance" "app" {
  ami           = "ami-0735c191cf914754d"  # Ubuntu 22.04 LTS in us-west-2
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  key_name      = aws_key_pair.deployer.key_name  # Reference the key pair we just created

  root_block_device {
    volume_size = 20
    volume_type = "gp2"
  }

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y postgresql postgresql-contrib
              systemctl start postgresql
              systemctl enable postgresql
              EOF

  tags = {
    Name = "slack-app-server"
  }
}

output "public_ip" {
  value = aws_instance.app.public_ip
}