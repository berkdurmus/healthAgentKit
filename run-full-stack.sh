#!/bin/bash

# Health Agent Kit - Full Stack Launcher
echo "🚀 Starting Health Agent Kit Full Stack..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start API server in background
echo "🔧 Starting API server on port 3002..."
npm run api &
API_PID=$!

# Wait a moment for API to start
sleep 3

# Start frontend
echo "🌐 Starting frontend on port 3001..."
npm run web &
WEB_PID=$!

echo "✅ Health Agent Kit is running!"
echo "📊 API Server: http://localhost:3002"
echo "🌐 Frontend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "echo '⏹️  Stopping services...'; kill $API_PID $WEB_PID; exit" INT
wait 