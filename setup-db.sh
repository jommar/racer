#!/bin/bash
echo "🚀 Resetting NitroDash Database..."
docker-compose down -v
docker-compose up -d
echo "⏳ Waiting for DB to be ready..."
sleep 5
echo "✅ Database is up on port 5433!"
