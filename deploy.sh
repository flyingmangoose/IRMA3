#!/bin/bash

# IRMA System Deployment Script
# This script prepares and deploys the IRMA system

echo "Starting IRMA system deployment..."

# Create deployment directory
DEPLOY_DIR="/home/ubuntu/irma-deploy"
mkdir -p $DEPLOY_DIR

# Copy backend files
echo "Copying backend files..."
mkdir -p $DEPLOY_DIR/backend
cp -r /home/ubuntu/irma-project/backend/* $DEPLOY_DIR/backend/

# Install backend dependencies
echo "Installing backend dependencies..."
cd $DEPLOY_DIR/backend
npm install --production

# Build frontend
echo "Building frontend..."
cd /home/ubuntu/irma-project/frontend
npm install
npm run build

# Copy frontend build to deployment directory
echo "Copying frontend build..."
mkdir -p $DEPLOY_DIR/frontend
cp -r /home/ubuntu/irma-project/frontend/dist/* $DEPLOY_DIR/frontend/

# Create environment configuration
echo "Creating environment configuration..."
cat > $DEPLOY_DIR/backend/.env << EOL
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb://localhost:27017/irma
JWT_SECRET=irma_jwt_secret_key
JWT_EXPIRE=24h
EOL

# Create startup script
echo "Creating startup script..."
cat > $DEPLOY_DIR/start.sh << EOL
#!/bin/bash
cd \$(dirname \$0)/backend
node server.js
EOL
chmod +x $DEPLOY_DIR/start.sh

# Create nginx configuration for serving the frontend
echo "Creating nginx configuration..."
cat > $DEPLOY_DIR/irma.conf << EOL
server {
    listen 80;
    server_name irma.example.com;

    location / {
        root /home/ubuntu/irma-deploy/frontend;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

echo "Deployment preparation complete!"
echo "To deploy to production:"
echo "1. Copy the irma-deploy directory to your production server"
echo "2. Install MongoDB on the production server"
echo "3. Install Node.js on the production server"
echo "4. Copy the nginx configuration to /etc/nginx/sites-available/"
echo "5. Create a symbolic link to /etc/nginx/sites-enabled/"
echo "6. Restart nginx"
echo "7. Run the start.sh script to start the backend server"
echo "8. Consider using PM2 for process management in production"

echo "For local testing:"
echo "1. Start MongoDB"
echo "2. Run the start.sh script"
echo "3. Access the application at http://localhost:3000"
