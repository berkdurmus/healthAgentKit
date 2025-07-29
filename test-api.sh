#!/bin/bash

echo "🧪 Testing Health Agent Kit API..."

# Test health endpoint
echo "📊 Testing health endpoint..."
curl -s http://localhost:3002/api/health | head -c 200
echo ""

# Test agents endpoint
echo "🤖 Testing agents endpoint..."
curl -s http://localhost:3002/api/agents | head -c 200
echo ""

# Test patient generation
echo "👥 Testing patient generation..."
curl -s -X POST http://localhost:3002/api/patients/generate | head -c 200
echo ""

echo "✅ API test complete!" 