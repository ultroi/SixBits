#!/bin/bash

# Development Environment Switcher for Zariya
# Usage: ./dev-switch.sh [local|vercel]

ENVIRONMENT=$1

if [ "$ENVIRONMENT" = "local" ]; then
    echo "🔧 Switching to LOCAL DEVELOPMENT mode..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > frontend/.env
    echo "✅ Frontend configured for local backend (http://localhost:5000/api)"
    echo "🚀 Run 'npm start' to start both frontend and backend"

elif [ "$ENVIRONMENT" = "vercel" ]; then
    echo "🌐 Switching to VERCEL PRODUCTION mode..."
    echo "# REACT_APP_API_URL=/api" > frontend/.env
    echo "✅ Frontend configured for Vercel deployment (/api)"
    echo "🚀 Ready for Vercel deployment"

else
    echo "❌ Usage: $0 [local|vercel]"
    echo "   local  - Configure for local development"
    echo "   vercel - Configure for Vercel production"
    exit 1
fi

echo "🎉 Environment switched successfully!"