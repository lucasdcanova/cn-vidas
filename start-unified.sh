#!/bin/bash

echo "🔨 Building frontend..."
npm run build:client

echo "🚀 Starting unified server on port 3000..."
NODE_ENV=production npm run dev:server