#!/bin/bash

# IRMA Build Script
# This script builds the IRMA application for production

echo "🚀 Starting IRMA build process..."

# Navigate to project root directory
ROOT_DIR=$(pwd)

# Install and build frontend
echo "📦 Installing frontend dependencies..."
cd "$ROOT_DIR/frontend"
npm install

echo "🔨 Building frontend..."
npm run build

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$ROOT_DIR/backend"
npm install

echo "✅ Build completed successfully!"
echo ""
echo "To start the application in production mode:"
echo "1. Configure your MongoDB connection in backend/.env"
echo "2. Start the backend server: cd backend && npm start"
echo "3. The frontend is built and will be served by the backend"
echo ""
echo "For more information, see the documentation directory." 