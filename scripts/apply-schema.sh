#!/bin/bash

###############################################################################
# Apply Database Schema to Supabase
#
# This script applies the schema.sql file to your Supabase database using psql
###############################################################################

set -e  # Exit on error

echo "============================================================"
echo "🗄️  SUPABASE SCHEMA APPLICATION"
echo "============================================================"
echo ""

# Load environment variables
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "   Make sure you're running this from the project root"
    exit 1
fi

# Source environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Validate required variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
    exit 1
fi

# Extract project reference from URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')

echo "📋 Project Information:"
echo "   URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "   Project Ref: $PROJECT_REF"
echo ""

# Check if schema file exists
if [ ! -f "supabase/schema.sql" ]; then
    echo "❌ Error: supabase/schema.sql not found"
    exit 1
fi

echo "📖 Schema file found: supabase/schema.sql"
echo ""

# Database connection info
echo "🔐 Database Connection:"
echo "   You need the database password from Supabase Dashboard"
echo "   Go to: Settings → Database → Connection String"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql (PostgreSQL client) not found"
    echo ""
    echo "💡 Installation options:"
    echo "   1. Windows: Download from https://www.postgresql.org/download/windows/"
    echo "   2. Or use Supabase Dashboard (Manual method)"
    echo ""
    echo "📖 See scripts/apply-schema.md for manual instructions"
    exit 1
fi

echo "✓ psql found: $(psql --version)"
echo ""

# Prompt for database password
echo "🔑 Please enter your Supabase database password:"
echo "   (Found in Supabase Dashboard → Settings → Database)"
read -s DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Error: Database password is required"
    exit 1
fi

# Construct connection string
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "🚀 Applying schema to database..."
echo "   This may take 10-30 seconds..."
echo ""

# Apply schema using psql
if psql "$CONNECTION_STRING" -f supabase/schema.sql; then
    echo ""
    echo "============================================================"
    echo "✅ SCHEMA APPLIED SUCCESSFULLY!"
    echo "============================================================"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Verify tables in Supabase Dashboard → Table Editor"
    echo "   2. Expected tables (7):"
    echo "      • users"
    echo "      • courses"
    echo "      • modules"
    echo "      • lessons"
    echo "      • user_progress"
    echo "      • bookmarks"
    echo "      • notes"
    echo ""
    echo "   3. Create your first user:"
    echo "      • Via Dashboard: Authentication → Users → Add user"
    echo "      • Or programmatically via supabase.auth.signUp()"
    echo ""
else
    echo ""
    echo "============================================================"
    echo "❌ SCHEMA APPLICATION FAILED"
    echo "============================================================"
    echo ""
    echo "💡 Common issues:"
    echo "   • Incorrect database password"
    echo "   • Firewall blocking port 5432"
    echo "   • Tables already exist (check Dashboard)"
    echo ""
    echo "📖 Try the manual method:"
    echo "   See scripts/apply-schema.md for step-by-step instructions"
    echo ""
    exit 1
fi
