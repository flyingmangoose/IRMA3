#!/bin/bash

# IRMA Quick Start Script
# This script helps users quickly start the IRMA application in development mode

echo "🚀 Starting IRMA development environment..."

# Check if MongoDB is installed
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB found"
else
    echo "❌ MongoDB not found. Please install MongoDB before continuing."
    echo "Visit https://www.mongodb.com/try/download/community for installation instructions."
    exit 1
fi

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo "✅ Node.js found: $(node --version)"
else
    echo "❌ Node.js not found. Please install Node.js (v14 or later) before continuing."
    echo "Visit https://nodejs.org/ for installation instructions."
    exit 1
fi

# Navigate to project root directory
ROOT_DIR=$(pwd)

# Start MongoDB in background (if not already running)
echo "🔄 Starting MongoDB..."
mongod --fork --logpath /tmp/mongodb.log || echo "MongoDB might already be running"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$ROOT_DIR/backend"
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file for backend..."
    cat > .env << EOL
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/irma
JWT_SECRET=irma_secret_key_development
JWT_EXPIRE=30d
EOL
fi

# Start backend in background
echo "🚀 Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd "$ROOT_DIR/frontend"
npm install

# Start frontend
echo "🚀 Starting frontend server..."
npm run serve

# Cleanup function
function cleanup {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID
    echo "✅ Servers stopped"
}

# Register cleanup function
trap cleanup EXIT

echo "✅ IRMA development environment is running!" 