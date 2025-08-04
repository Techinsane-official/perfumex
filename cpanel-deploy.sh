#!/bin/bash

# cPanel Deployment Script for Perfume Selling App
echo "🚀 Starting cPanel deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️ Building the application..."
npm run build

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js

echo "✅ Deployment completed!"
echo "🌐 Your app should be running on port 3000"
echo "📊 Check status with: pm2 status"
echo "📋 View logs with: pm2 logs" 