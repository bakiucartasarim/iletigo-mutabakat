#!/bin/bash

# BillionMail Deployment Script for Coolify
# This script helps deploy BillionMail on Coolify

set -e

echo "🚀 BillionMail Coolify Deployment Script"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration:"
    echo "   - DOMAIN=mail.yourdomain.com"
    echo "   - ADMIN_EMAIL=admin@yourdomain.com"
    echo "   - ADMIN_PASSWORD=your_secure_password"
    echo "   - MYSQL_ROOT_PASSWORD=mysql_root_password"
    echo "   - MYSQL_PASSWORD=mysql_user_password"
    echo ""
    echo "After editing .env, run this script again."
    exit 1
fi

echo "✅ .env file found"
echo ""

# Load environment variables
source .env

echo "📋 Configuration:"
echo "  Domain: $DOMAIN"
echo "  Admin Email: $ADMIN_EMAIL"
echo "  MySQL Database: $MYSQL_DATABASE"
echo "  Timezone: $TZ"
echo ""

# Check if running on Coolify
if [ -n "$COOLIFY" ]; then
    echo "✅ Running on Coolify environment"
else
    echo "⚠️  Not running on Coolify. This script is optimized for Coolify."
fi

echo ""
echo "🔧 Pulling latest BillionMail image..."
docker compose pull

echo ""
echo "🚀 Starting BillionMail..."
docker compose up -d

echo ""
echo "⏳ Waiting for BillionMail to start (60 seconds)..."
sleep 60

echo ""
echo "🔍 Checking container status..."
docker ps | grep billionmail || echo "⚠️  Container not running!"

echo ""
echo "📊 Container logs:"
docker logs billionmail --tail 50

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📝 Next steps:"
echo "1. Configure DNS records (see README.md)"
echo "2. Access BillionMail at: https://$DOMAIN:8888/billionmail"
echo "3. Login with:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: (from .env ADMIN_PASSWORD)"
echo ""
echo "4. Get DKIM record:"
echo "   docker exec billionmail bm show-record"
echo ""
echo "5. View default credentials:"
echo "   docker exec billionmail bm default"
echo ""
echo "For more information, see README.md"