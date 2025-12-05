#!/bin/bash

# Quick Start Script for 4G3N7 Document Processor
# This script sets up and runs the document processing microservice

set -e

echo "🚀 4G3N7 Document Processor - Quick Start"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the 4g3n7-document-processor directory"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🔧 Step 2: Generating Prisma client..."
npx prisma generate

echo ""
echo "🗄️  Step 3: Setting up environment..."
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5433/document_processor"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=

# Server
PORT=9993
NODE_ENV=development

# CORS
CORS_ORIGIN=*

# Object Storage (S3/MinIO)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=documents

# OpenAI (optional)
OPENAI_API_KEY=
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🐳 Step 4: Starting Docker services..."
echo "Starting PostgreSQL, Redis, and MinIO..."
cd ../../docker
docker-compose -f docker-compose.document-processor.yml up -d postgres-doc redis-doc minio minio-mc

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

cd ../packages/4g3n7-document-processor

echo ""
echo "📊 Step 5: Running database migrations..."
npx prisma migrate dev --name init || echo "Migrations already applied or error occurred"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Start the development server:"
echo "   npm run start:dev"
echo ""
echo "2. Or build and run in production mode:"
echo "   npm run build"
echo "   npm run start:prod"
echo ""
echo "3. Test the service:"
echo "   curl http://localhost:9993/health"
echo ""
echo "4. Access MinIO Console:"
echo "   http://localhost:9001"
echo "   Username: minioadmin"
echo "   Password: minioadmin"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Service overview and features"
echo "   - IMPLEMENTATION_GUIDE.md - Detailed setup instructions"
echo "   - PHASE_2_COMPLETION_SUMMARY.md - Project completion details"
echo ""
echo "Happy coding! 🎉"
