#!/bin/bash

echo "🚀 Bodensee Immobilien - GitHub + Vercel Deployment"
echo "=================================================="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

echo "📋 Deployment Steps:"
echo ""
echo "1. 📤 Push to GitHub:"
echo "   - Gehen Sie zu: https://github.com/new"
echo "   - Erstellen Sie ein neues Repository: 'bodensee-immobilien'"
echo "   - Führen Sie diese Befehle aus:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/bodensee-immobilien.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""

echo "2. 🔗 Vercel Verbindung:"
echo "   - Öffnen Sie: https://vercel.com/dashboard"
echo "   - Klicken Sie 'New Project'"
echo "   - Wählen Sie Ihr GitHub Repository"
echo "   - Deploy!"
echo ""

echo "3. ⚙️ Environment Variables (in Vercel Dashboard):"
echo "   DATABASE_URL=file:./database.sqlite"
echo "   NODE_ENV=production"
echo "   AUTH_ENABLED=true"
echo "   SESSION_SECRET=your-secure-secret-here"
echo ""

echo "4. 🌐 Your app will be live at:"
echo "   https://bodensee-immobilien.vercel.app"
echo ""

echo "✅ Das ist der einfachste und zuverlässigste Weg!"
echo "💡 Jeder neue Git-Push deployt automatisch!"
echo ""

echo "📝 GitHub Repository URL eingeben (z.B. https://github.com/username/repo):"
read -r REPO_URL
echo "Repository URL gesetzt: $REPO_URL"
echo ""
echo "📤 Pushing to GitHub..."
git add .
git commit -m "feat: Ready for Vercel deployment" || true
    
echo ""
echo "⚠️  Sie müssen jetzt:"
echo "1. Ein GitHub Repository erstellen"
echo "2. Den Remote hinzufügen:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/bodensee-immobilien.git"
echo "3. Pushen:"
echo "   git push -u origin main"
echo ""

echo "🎉 Danach ist Ihre App in 2-3 Minuten live!"