#!/bin/bash
# Quick Deployment Script for Bodensee Immobilien Platform

echo "🚀 Bodensee Immobilien - Quick Deployment"
echo "========================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "⚠️  Git repository not found. Initializing..."
    git init
    git add .
    git commit -m "Initial commit - Ready for deployment"
fi

echo ""
echo "📋 Choose your hosting platform:"
echo "1) Vercel (Recommended for quick testing)"
echo "2) Railway (Full-stack with database)"  
echo "3) Render (Balanced option)"
echo "4) Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔄 Deploying to Vercel..."
        if ! command -v vercel &> /dev/null; then
            echo "Installing Vercel CLI..."
            npm install -g vercel
        fi
        
        echo "📝 Create .env.production:"
        cat > .env.production << EOF
DATABASE_URL=file:./database.sqlite
NODE_ENV=production
AUTH_ENABLED=true
SESSION_SECRET=$(openssl rand -base64 32)
EOF
        
        echo "🚀 Starting Vercel deployment..."
        vercel --prod
        ;;
        
    2)
        echo ""
        echo "🔄 Deploying to Railway..."
        if ! command -v railway &> /dev/null; then
            echo "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        
        echo "🚀 Starting Railway deployment..."
        railway login
        railway init
        railway add postgresql
        railway up
        ;;
        
    3)
        echo ""
        echo "🔄 Preparing for Render deployment..."
        echo "📝 Visit: https://render.com"
        echo "1. Connect your GitHub repository"
        echo "2. Create a Web Service"
        echo "3. Add PostgreSQL database"
        echo "4. Configure environment variables"
        echo ""
        echo "📋 Build Command: npm run build"
        echo "📋 Start Command: npm start"
        ;;
        
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment process completed!"
echo "🌐 Your app should be live soon!"
echo ""
echo "🔗 Test your deployment:"
echo "   - Health Check: /api/health"
echo "   - Admin Login: /admin/login"
echo "   - Home Page: /"