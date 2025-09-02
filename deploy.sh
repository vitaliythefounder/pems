#!/bin/bash

echo "🚀 Just Everything Platform - Deployment Script"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project root found"

# Build the React app
echo "🔨 Building React app..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ React app built successfully"
else
    echo "❌ Build failed. Please check for errors."
    exit 1
fi

# Check if build directory exists
if [ -d "build" ]; then
    echo "✅ Build directory created: build/"
    echo "📁 Build contents:"
    ls -la build/
else
    echo "❌ Build directory not found"
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Push your code to GitHub"
echo "2. Set up MongoDB Atlas (see DEPLOYMENT.md)"
echo "3. Deploy frontend to Vercel"
echo "4. Deploy backend to Railway"
echo "5. Connect everything together"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo "�� Happy deploying!"
