#!/bin/bash
# Vercel Post-Deploy Script
# This script runs migrations automatically after deployment

echo "🚀 Running database migrations..."

# Run Prisma migrations
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

echo "🎉 Deployment setup complete!"

