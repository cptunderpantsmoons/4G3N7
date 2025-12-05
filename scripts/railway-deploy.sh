#!/bin/bash

# Railway Deployment Script for 4G3N7
# This script helps prepare and deploy 4G3N7 to Railway

set -e

echo "🚀 4G3N7 Railway Deployment Preparation"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if Railway CLI is installed
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed"
        print_info "Install it with: npm install -g @railway/cli"
        exit 1
    fi
    print_status "Railway CLI is installed"
}

# Check if user is logged in to Railway
check_railway_auth() {
    if ! railway whoami &> /dev/null; then
        print_error "Not logged in to Railway"
        print_info "Login with: railway login"
        exit 1
    fi
    print_status "Logged in to Railway"
}

# Verify package.json files exist for renamed packages
verify_package_structure() {
    print_info "Verifying 4G3N7 package structure..."

    local packages=("4g3n7-agent" "4g3n7-ui" "4g3n7d")

    for package in "${packages[@]}"; do
        if [ ! -f "packages/$package/package.json" ]; then
            print_error "Missing package.json for $package"
            exit 1
        fi
    done

    print_status "All package.json files found"
}

# Check if Dockerfiles exist
verify_dockerfiles() {
    print_info "Verifying Dockerfiles..."

    local dockerfiles=("4g3n7-agent" "4g3n7-ui" "4g3n7d")

    for dockerfile in "${dockerfiles[@]}"; do
        if [ ! -f "packages/$dockerfile/Dockerfile" ]; then
            print_error "Missing Dockerfile for $dockerfile"
            exit 1
        fi
    done

    print_status "All Dockerfiles found"
}

# Check environment variables
check_env_vars() {
    print_info "Checking environment variables..."

    if [ ! -f ".env.railway.example" ]; then
        print_error ".env.railway.example not found"
        exit 1
    fi

    print_warning "Make sure to set these environment variables in Railway:"
    echo "  - ANTHROPIC_API_KEY (or OPENAI_API_KEY or GEMINI_API_KEY)"
    echo "  - DATABASE_URL (auto-set by Railway)"
    echo "  - Optional: FILE_STORAGE_PROVIDER, AWS_* keys for object storage"
}

# Build and test locally (optional)
local_test() {
    if [ "$1" = "--skip-local-test" ]; then
        print_warning "Skipping local build test"
        return
    fi

    print_info "Testing local build with Railway Docker Compose..."

    # Build images
    docker-compose -f railway-docker-compose.yml build

    if [ $? -eq 0 ]; then
        print_status "Local build successful"
    else
        print_error "Local build failed"
        exit 1
    fi
}

# Deploy to Railway
deploy_to_railway() {
    print_info "Deploying to Railway..."

    # Initialize Railway project if not already done
    if [ ! -f "railway.toml" ]; then
        print_warning "railway.toml not found, creating..."
        # railway will create this automatically
    fi

    # Deploy
    railway up

    if [ $? -eq 0 ]; then
        print_status "Deployment initiated successfully!"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Show deployment status
show_deployment_status() {
    print_info "Deployment status:"
    railway status
}

# Show next steps
show_next_steps() {
    echo ""
    echo "🎉 Deployment Next Steps:"
    echo "========================"
    echo ""
    echo "1. Configure Environment Variables in Railway Dashboard:"
    echo "   - Set at least one AI provider key (ANTHROPIC_API_KEY recommended)"
    echo "   - Review .env.railway.example for optional settings"
    echo ""
    echo "2. Monitor Deployment:"
    echo "   - railway status (check deployment progress)"
    echo "   - railway logs (view service logs)"
    echo ""
    echo "3. Access Your 4G3N7 Instance:"
    echo "   - Railway will provide a URL for the 4g3n7-ui service"
    echo "   - This is your main entry point to the application"
    echo ""
    echo "4. Post-Deployment (Optional):"
    echo "   - Run file storage migration: POST /files/migration/start"
    echo "   - Set up database replication if needed"
    echo "   - Configure custom domain (Railway dashboard)"
    echo ""
}

# Main execution
main() {
    echo ""

    # Parse arguments
    SKIP_LOCAL_TEST=false
    if [ "$1" = "--skip-local-test" ]; then
        SKIP_LOCAL_TEST=true
    fi

    # Run checks
    check_railway_cli
    check_railway_auth
    verify_package_structure
    verify_dockerfiles
    check_env_vars

    # Optional local test
    local_test $SKIP_LOCAL_TEST

    # Deploy
    deploy_to_railway

    # Show status
    show_deployment_status

    # Show next steps
    show_next_steps
}

# Run main function
main "$@"