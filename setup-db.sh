#!/bin/bash
echo "🚀 Resetting NitroDash Database..."
# Kill any existing backend processes on ports 3000, 3001, 3010, 8080
sudo lsof -t -i:3000,3001,3010,8080 | xargs -r sudo kill -9
docker-compose down -v
docker-compose up -d
echo "⏳ Waiting for DB to be ready..."
sleep 5
echo "✅ Database is up on port 5433!"
