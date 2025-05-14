# IRMA System Deployment Guide

This guide provides detailed instructions for deploying the Integrated Resource Management Application (IRMA) in various environments. We've included multiple deployment options to accommodate different technical requirements and expertise levels.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Local Development Deployment](#local-development-deployment)
3. [Production Deployment Options](#production-deployment-options)
   - [Traditional Server Deployment](#traditional-server-deployment)
   - [Docker Deployment](#docker-deployment)
   - [Cloud Deployment](#cloud-deployment)
4. [Database Setup](#database-setup)
5. [Configuration](#configuration)
6. [Initial Setup](#initial-setup)
7. [Backup and Maintenance](#backup-and-maintenance)
8. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Hardware Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 20GB minimum

### Software Requirements
- **Operating System**: Linux (Ubuntu 20.04+), Windows Server 2016+, or macOS 10.15+
- **Node.js**: Version 16.x or higher
- **MongoDB**: Version 5.0 or higher
- **Web Server**: Nginx or Apache (for production)
- **SSL Certificate**: Required for production deployment

## Local Development Deployment

This is the simplest deployment method for testing and development purposes.

### Step 1: Install Prerequisites

#### For Ubuntu/Debian:
```bash
# Update package lists
sudo apt update

# Install Node.js and npm
sudo apt install -y nodejs npm

# Install MongoDB
sudo apt install -y mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify MongoDB is running
sudo systemctl status mongodb
```

#### For Windows:
1. Download and install Node.js from [nodejs.org](https://nodejs.org/)
2. Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
3. Follow the installation wizards for both

#### For macOS:
```bash
# Using Homebrew
brew update
brew install node
brew install mongodb-community
brew services start mongodb-community
```

### Step 2: Clone the Repository

```bash
# Create a directory for the application
mkdir -p /opt/irma
cd /opt/irma

# Clone the repository (replace with your actual repository URL)
git clone https://github.com/your-organization/irma.git .
```

### Step 3: Install Dependencies

```bash
# Install backend dependencies
cd /opt/irma/backend
npm install

# Install frontend dependencies
cd /opt/irma/frontend
npm install
```

### Step 4: Configure the Application

```bash
# Create environment file for backend
cd /opt/irma/backend
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

Update the following variables in the .env file:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/irma
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRATION=86400
```

### Step 5: Start the Application

```bash
# Start the backend server
cd /opt/irma/backend
npm run dev

# In a new terminal, start the frontend development server
cd /opt/irma/frontend
npm run serve
```

The application should now be accessible at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

## Production Deployment Options

### Traditional Server Deployment

This method deploys the application on a traditional server with Node.js and MongoDB.

#### Step 1: Install Prerequisites

Follow the same steps as in the Local Development Deployment to install Node.js and MongoDB.

#### Step 2: Install Nginx

```bash
# Install Nginx
sudo apt update
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Step 3: Clone and Build the Application

```bash
# Create a directory for the application
sudo mkdir -p /opt/irma
sudo chown -R $USER:$USER /opt/irma
cd /opt/irma

# Clone the repository
git clone https://github.com/your-organization/irma.git .

# Install backend dependencies
cd /opt/irma/backend
npm install

# Install frontend dependencies and build
cd /opt/irma/frontend
npm install
npm run build
```

#### Step 4: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/irma
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Frontend static files
    location / {
        root /opt/irma/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/irma /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: Set Up Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the backend with PM2
cd /opt/irma/backend
pm2 start server.js --name "irma-backend"

# Set PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
pm2 save
```

### Docker Deployment

This method uses Docker and Docker Compose for easier deployment and management.

#### Step 1: Install Docker and Docker Compose

```bash
# Install Docker
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
sudo apt install -y docker-ce

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to the docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### Step 2: Create Docker Compose Configuration

```bash
# Create a directory for the application
mkdir -p /opt/irma
cd /opt/irma

# Clone the repository
git clone https://github.com/your-organization/irma.git .

# Create docker-compose.yml file
nano docker-compose.yml
```

Add the following configuration:
```yaml
version: '3'

services:
  mongodb:
    image: mongo:5.0
    container_name: irma-mongodb
    volumes:
      - mongodb_data:/data/db
    restart: always
    networks:
      - irma-network

  backend:
    build:
      context: ./backend
    container_name: irma-backend
    restart: always
    depends_on:
      - mongodb
    environment:
      - PORT=3000
      - MONGODB_URI=mongodb://mongodb:27017/irma
      - JWT_SECRET=your_secure_jwt_secret
      - JWT_EXPIRATION=86400
    networks:
      - irma-network

  frontend:
    build:
      context: ./frontend
    container_name: irma-frontend
    restart: always
    depends_on:
      - backend
    networks:
      - irma-network

  nginx:
    image: nginx:latest
    container_name: irma-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - irma-network

networks:
  irma-network:
    driver: bridge

volumes:
  mongodb_data:
```

#### Step 3: Create Nginx Configuration for Docker

```bash
# Create Nginx configuration directory
mkdir -p /opt/irma/nginx/conf.d
mkdir -p /opt/irma/nginx/ssl

# Create Nginx configuration file
nano /opt/irma/nginx/conf.d/default.conf
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name localhost;

    # For production, redirect to HTTPS
    # return 301 https://$host$request_uri;

    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# For production, uncomment and configure SSL
# server {
#     listen 443 ssl;
#     server_name localhost;
#
#     ssl_certificate /etc/nginx/ssl/certificate.crt;
#     ssl_certificate_key /etc/nginx/ssl/private.key;
#
#     location / {
#         proxy_pass http://frontend:80;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_cache_bypass $http_upgrade;
#     }
#
#     location /api {
#         proxy_pass http://backend:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_cache_bypass $http_upgrade;
#     }
# }
```

#### Step 4: Create Dockerfile for Backend

```bash
# Create Dockerfile for backend
nano /opt/irma/backend/Dockerfile
```

Add the following content:
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### Step 5: Create Dockerfile for Frontend

```bash
# Create Dockerfile for frontend
nano /opt/irma/frontend/Dockerfile
```

Add the following content:
```dockerfile
FROM node:16-alpine as build-stage

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Step 6: Build and Start the Docker Containers

```bash
# Build and start the containers
cd /opt/irma
docker-compose up -d

# Check if containers are running
docker-compose ps
```

The application should now be accessible at http://localhost.

### Cloud Deployment

For cloud deployment, we'll provide instructions for deploying to AWS, though similar principles apply to other cloud providers.

#### AWS Deployment

##### Step 1: Set Up AWS Resources

1. Create an EC2 instance (t3.small or larger recommended)
2. Configure security groups to allow HTTP (80), HTTPS (443), and SSH (22) traffic
3. Allocate and associate an Elastic IP (optional but recommended)
4. Create a MongoDB instance using AWS DocumentDB or set up MongoDB on a separate EC2 instance

##### Step 2: Connect to Your EC2 Instance

```bash
ssh -i your-key.pem ec2-user@your-instance-ip
```

##### Step 3: Install Docker and Docker Compose

Follow the Docker Deployment instructions above to install Docker and Docker Compose on your EC2 instance.

##### Step 4: Deploy Using Docker Compose

Follow the Docker Deployment steps to set up and run the application using Docker Compose.

##### Step 5: Set Up a Domain Name (Optional)

1. Register a domain name through AWS Route 53 or another domain registrar
2. Create a DNS record pointing to your EC2 instance's Elastic IP
3. Update the Nginx configuration to use your domain name

##### Step 6: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Verify auto-renewal is set up
sudo systemctl status certbot.timer
```

## Database Setup

### MongoDB Setup

#### Creating the Database

```bash
# Connect to MongoDB shell
mongo

# Create and use the IRMA database
use irma

# Create initial admin user for the database
db.createUser({
  user: "irma_admin",
  pwd: "secure_password",
  roles: [{ role: "readWrite", db: "irma" }]
})

# Exit MongoDB shell
exit
```

#### Importing Initial Data (Optional)

```bash
# Navigate to the backend directory
cd /opt/irma/backend

# Import initial data
mongoimport --db irma --collection users --file data/users.json --jsonArray
mongoimport --db irma --collection clients --file data/clients.json --jsonArray
mongoimport --db irma --collection projects --file data/projects.json --jsonArray
```

## Configuration

### Environment Variables

The application uses environment variables for configuration. Here are the key variables:

#### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port for the backend server | 3000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/irma |
| JWT_SECRET | Secret for JWT token generation | (No default, must be set) |
| JWT_EXPIRATION | JWT token expiration in seconds | 86400 (24 hours) |
| NODE_ENV | Environment (development/production) | development |
| LOG_LEVEL | Logging level | info |
| SMTP_HOST | SMTP server for email notifications | (Optional) |
| SMTP_PORT | SMTP port | 587 |
| SMTP_USER | SMTP username | (Optional) |
| SMTP_PASS | SMTP password | (Optional) |
| SMTP_FROM | From email address | (Optional) |

#### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VUE_APP_API_URL | Backend API URL | http://localhost:3000 |
| VUE_APP_TITLE | Application title | IRMA |

### Configuration Files

#### Backend Configuration

The main configuration file is located at `/opt/irma/backend/config/config.js`. This file loads environment variables and sets default values.

#### Frontend Configuration

The frontend configuration is managed through environment variables and the `.env` file in the frontend directory.

## Initial Setup

### First-Time Setup

After deploying the application, follow these steps to complete the initial setup:

1. Access the application in your browser
2. Log in with the default admin credentials:
   - Email: admin@example.com
   - Password: admin123
3. Change the default admin password immediately
4. Set up your organization details
5. Create user accounts for your team members
6. Create client records
7. Set up projects

### Default User Accounts

The system comes with these default accounts for testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Manager | manager@example.com | manager123 |
| Employee | employee@example.com | employee123 |

**Important**: Change these passwords immediately after deployment!

## Backup and Maintenance

### Database Backup

#### Automated Daily Backups

```bash
# Create a backup script
nano /opt/irma/backup.sh
```

Add the following content:
```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/opt/irma/backups"
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --db irma --out $BACKUP_DIR/$TIMESTAMP

# Compress the backup
cd $BACKUP_DIR
tar -zcvf $TIMESTAMP.tar.gz $TIMESTAMP
rm -rf $TIMESTAMP

# Keep only the last 7 backups
ls -tp $BACKUP_DIR/*.tar.gz | grep -v '/$' | tail -n +8 | xargs -I {} rm -- {}
```

Make the script executable and set up a cron job:
```bash
chmod +x /opt/irma/backup.sh

# Add to crontab (runs daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/irma/backup.sh") | crontab -
```

### System Updates

#### Updating the Application

```bash
# Navigate to the application directory
cd /opt/irma

# Pull the latest changes
git pull

# For traditional deployment:
# Update backend
cd /opt/irma/backend
npm install
pm2 restart irma-backend

# Update frontend
cd /opt/irma/frontend
npm install
npm run build

# For Docker deployment:
cd /opt/irma
docker-compose down
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Common Issues and Solutions

#### Backend Won't Start

**Issue**: The backend server fails to start.

**Solutions**:
1. Check MongoDB connection:
   ```bash
   mongo mongodb://localhost:27017/irma
   ```
2. Verify environment variables:
   ```bash
   cd /opt/irma/backend
   cat .env
   ```
3. Check for port conflicts:
   ```bash
   sudo netstat -tulpn | grep 3000
   ```

#### Frontend Shows API Connection Error

**Issue**: The frontend can't connect to the backend API.

**Solutions**:
1. Verify the backend is running:
   ```bash
   curl http://localhost:3000/api/health
   ```
2. Check the API URL in frontend configuration:
   ```bash
   cd /opt/irma/frontend
   cat .env
   ```
3. Check for CORS issues in the browser console

#### Database Connection Issues

**Issue**: Application can't connect to MongoDB.

**Solutions**:
1. Verify MongoDB is running:
   ```bash
   sudo systemctl status mongodb
   ```
2. Check MongoDB connection string:
   ```bash
   mongo "mongodb://localhost:27017/irma"
   ```
3. Verify network connectivity between application and database

### Logs

#### Accessing Logs

**Backend Logs (Traditional Deployment)**:
```bash
# Using PM2
pm2 logs irma-backend

# Direct log files
cat /opt/irma/backend/logs/app.log
```

**Docker Logs**:
```bash
# View logs for all containers
docker-compose logs

# View logs for a specific container
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
```

**Nginx Logs**:
```bash
# Access logs
sudo cat /var/log/nginx/access.log

# Error logs
sudo cat /var/log/nginx/error.log
```

## Conclusion

This deployment guide covers the most common deployment scenarios for the IRMA system. If you encounter any issues not covered in this guide, please contact our support team for assistance.

Remember to regularly back up your data and keep the system updated with the latest security patches and feature enhancements.
