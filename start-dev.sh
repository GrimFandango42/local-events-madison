#!/bin/bash

# Clean startup script for Local Events
echo "🚀 Starting Local Events Development Server..."
echo ""

# Kill any existing processes on port 5000
echo "Checking for existing processes on port 5000..."
lsof -ti :5000 | xargs kill -9 2>/dev/null || echo "No existing processes found"

# Clear Next.js cache for fresh start
echo "Clearing Next.js cache..."
rm -rf .next

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Push database schema if needed
echo "Ensuring database is up to date..."
npx prisma db push --accept-data-loss

# Start the development server
echo ""
echo "🎯 Starting server on http://localhost:5000"
echo "   - Homepage: http://localhost:5000"  
echo "   - Events: http://localhost:5000/events"
echo "   - Sign In: http://localhost:5000/auth/signin"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev