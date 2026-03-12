#!/bin/bash
# Migration script for Vercel deployment
# Handles both fresh databases and existing databases that need baselining

echo "Running Prisma migrations..."

# Try to run migrations
if prisma migrate deploy; then
  echo "✓ Migrations applied successfully"
  exit 0
else
  echo "Migration failed, attempting to baseline..."
  
  # If failed, baseline the existing database
  if prisma migrate resolve --applied 0_init; then
    echo "✓ Database baselined"
    
    # Try migrations again
    if prisma migrate deploy; then
      echo "✓ Migrations applied after baselining"
      exit 0
    else
      echo "✗ Migrations failed after baselining"
      exit 1
    fi
  else
    echo "✗ Baselining failed"
    exit 1
  fi
fi

