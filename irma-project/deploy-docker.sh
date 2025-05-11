#!/bin/bash

# IRMA System Docker Deployment Script
# This script prepares and deploys the IRMA system using Docker

echo "Starting IRMA system Docker deployment..."

# Create deployment directory
DEPLOY_DIR="/home/ubuntu/irma-docker"
mkdir -p $DEPLOY_DIR

# Copy project files
echo "Copying project files..."
cp -r /home/ubuntu/irma-project/* $DEPLOY_DIR/

# Create Docker Compose file
echo "Creating Docker Compose configuration..."
cat > $DEPLOY_DIR/docker-compose.yml << EOL
version: '3'

services:
  # MongoDB service
  mongodb:
    image: mongo:latest
    container_name: irma-mongodb
    restart: always
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"
    networks:
      - irma-network

  # Backend service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: irma-backend
    restart: always
    depends_on:
      - mongodb
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGO_URI=mongodb://mongodb:27017/irma
      - JWT_SECRET=irma_jwt_secret_key
      - JWT_EXPIRE=24h
    ports:
      - "3000:3000"
    networks:
      - irma-network

  # Frontend service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: irma-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - irma-network

networks:
  irma-network:
    driver: bridge

volumes:
  mongo-data:
EOL

# Create Backend Dockerfile
echo "Creating Backend Dockerfile..."
cat > $DEPLOY_DIR/backend/Dockerfile << EOL
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
EOL

# Create Frontend Dockerfile
echo "Creating Frontend Dockerfile..."
cat > $DEPLOY_DIR/frontend/Dockerfile << EOL
FROM node:16-alpine as build-stage

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOL

# Create Nginx configuration
echo "Creating Nginx configuration..."
cat > $DEPLOY_DIR/frontend/nginx.conf << EOL
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Create deployment script
echo "Creating deployment script..."
cat > $DEPLOY_DIR/deploy-docker.sh << EOL
#!/bin/bash

# Build and start the Docker containers
docker-compose up -d --build

# Display container status
docker-compose ps
EOL
chmod +x $DEPLOY_DIR/deploy-docker.sh

# Create backup script
echo "Creating backup script..."
cat > $DEPLOY_DIR/backup.sh << EOL
#!/bin/bash

# Create backup directory
BACKUP_DIR="\$(pwd)/backups/\$(date +%Y-%m-%d)"
mkdir -p \$BACKUP_DIR

# Backup MongoDB data
echo "Backing up MongoDB data..."
docker exec irma-mongodb mongodump --out=/dump
docker cp irma-mongodb:/dump \$BACKUP_DIR/mongodb

echo "Backup completed: \$BACKUP_DIR"
EOL
chmod +x $DEPLOY_DIR/backup.sh

echo "Docker deployment preparation complete!"
echo "To deploy the IRMA system:"
echo "1. Install Docker and Docker Compose on your server"
echo "2. Navigate to the irma-docker directory"
echo "3. Run ./deploy-docker.sh to build and start the containers"
echo "4. Access the application at http://localhost"
echo "5. Use ./backup.sh to create backups of your data"

echo "For production deployment:"
echo "1. Update the JWT_SECRET in docker-compose.yml to a secure value"
echo "2. Configure proper domain names in the Nginx configuration"
echo "3. Set up SSL/TLS certificates for secure HTTPS access"
echo "4. Configure proper network security and firewall rules"
echo "5. Set up regular backups using the backup.sh script"
