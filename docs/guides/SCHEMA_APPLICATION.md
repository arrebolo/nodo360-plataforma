# 📋 Schema Application Guide

## ✅ Current Status

Your Supabase backend setup is **COMPLETE** and ready to use:

- ✅ Dependencies installed (@supabase/supabase-js, @supabase/ssr, next-auth@beta)
- ✅ Environment variables configured (.env.local)
- ✅ Supabase clients created (client.ts, server.ts, middleware.ts)
- ✅ NextAuth configured with SupabaseAdapter
- ✅ Middleware configured for route protection
- ✅ Database schema created (supabase/schema.sql - 504 lines)
- ✅ API endpoints created (progress, bookmarks, notes, search)
- ✅ TypeScript types defined (types/database.ts)
- ✅ Query helpers created (lib/db/queries.ts)
- ✅ Session utilities created (lib/auth/session.ts)

## 🎯 Next Step: Apply Schema to Supabase Database

You need to apply the `supabase/schema.sql` file to your Supabase database. Here are your options:

---

## 🌟 OPTION 1: Manual via Dashboard (RECOMMENDED)

**Best for:** Quick setup, guaranteed to work, no dependencies

### Steps:

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Select your project:** `gcahtbecfidroepelcuw`

3. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

4. **Copy & Paste Schema**
   - Open file: `supabase/schema.sql`
   - Select ALL content (Ctrl+A)
   - Copy (Ctrl+C)
   - Paste into SQL Editor (Ctrl+V)

5. **Execute**
   - Click "Run" button (or Ctrl+Enter)
   - Wait 10-20 seconds for completion

6. **Verify Success**
   - Check for "Query executed successfully" message
   - Go to "Table Editor" in sidebar
   - Verify these 7 tables exist:
     - ✅ users
     - ✅ courses
     - ✅ modules
     - ✅ lessons
     - ✅ user_progress
     - ✅ bookmarks
     - ✅ notes

**Pros:**
- ✅ Always works
- ✅ No installation required
- ✅ Visual feedback
- ✅ Easy to debug

**Cons:**
- ⚠️ Manual copy-paste
- ⚠️ Not automated

---

## 🔧 OPTION 2: Using psql (Command Line)

**Best for:** Developers comfortable with command line, automation

### Prerequisites:

Install PostgreSQL client (includes `psql`):
- **Windows:** https://www.postgresql.org/download/windows/
- **Mac:** `brew install postgresql`
- **Linux:** `sudo apt install postgresql-client`

### Steps:

1. **Get Database Password**
   - Go to Supabase Dashboard → Settings → Database
   - Find "Connection string" section
   - Copy the password

2. **Run the script**
   ```bash
   cd /c/Users/alber/nodo360-projects/nodo360-plataforma
   bash scripts/apply-schema.sh
   ```

   Or manually with psql:
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.gcahtbecfidroepelcuw.supabase.co:5432/postgres" -f supabase/schema.sql
   ```

**Pros:**
- ✅ Automated
- ✅ Scriptable
- ✅ Reliable

**Cons:**
- ⚠️ Requires psql installation
- ⚠️ Requires database password

---

## 🚀 OPTION 3: Using Supabase CLI

**Best for:** Advanced users, CI/CD integration

### Prerequisites:

Install Supabase CLI (cannot use npm, use alternative):
- **Windows:** Download from https://github.com/supabase/cli/releases
- **Mac:** `brew install supabase/tap/supabase`
- **Via npx:** `npx supabase` (works but slower)

### Steps:

1. **Login to Supabase**
   ```bash
   npx supabase login
   ```

2. **Link project**
   ```bash
   cd /c/Users/alber/nodo360-projects/nodo360-plataforma
   npx supabase link --project-ref gcahtbecfidroepelcuw
   ```
   (Will prompt for database password)

3. **Push schema**
   ```bash
   npx supabase db push
   ```

**Pros:**
- ✅ Official tool
- ✅ Best for migrations
- ✅ Includes other features (functions, storage, etc.)

**Cons:**
- ⚠️ Requires project linking
- ⚠️ Requires database password
- ⚠️ npx is slower than local install

---

## 📊 What the Schema Creates

When you apply the schema, it will create:

### 🗄️ Tables (7)
1. **users** - User profiles extending auth.users
2. **courses** - Course information
3. **modules** - Course sections/modules
4. **lessons** - Individual lessons with video content
5. **user_progress** - Track lesson completion and watch time
6. **bookmarks** - User-saved lessons
7. **notes** - User notes with timestamps

### 🔐 Security
- Row Level Security (RLS) enabled on all tables
- 21 security policies configured
- Users can only access their own data

### 🎨 Custom Types (Enums)
- `user_role`: student, instructor, admin
- `course_level`: beginner, intermediate, advanced
- `course_status`: draft, published, archived

### ⚡ Triggers
- `update_updated_at` - Auto-update timestamps
- `handle_new_user` - Auto-create profile on signup

### 🔍 Indexes
- Optimized for common queries
- Full-text search enabled (pg_trgm extension)
- Spanish language search support

### 🧩 Extensions
- `uuid-ossp` - UUID generation
- `pg_trgm` - Full-text search

---

## ✅ After Applying Schema

### 1. Verify Tables

Go to Supabase Dashboard → Table Editor

You should see all 7 tables listed in the sidebar.

### 2. Create First User

**Option A: Via Dashboard**
```
1. Go to Authentication → Users
2. Click "Add user"
3. Email: your@email.com
4. Password: (strong password)
5. Auto-generated profile in 'users' table
```

**Option B: Programmatically**
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const { data, error } = await supabase.auth.signUp({
  email: 'your@email.com',
  password: 'your-secure-password',
  options: {
    data: {
      full_name: 'Your Name',
    }
  }
})
```

### 3. Test Backend

Once you have a user, test the APIs:

```bash
# Get user progress
curl http://localhost:3000/api/progress

# Search courses
curl http://localhost:3000/api/search?q=bitcoin

# Get bookmarks
curl http://localhost:3000/api/bookmarks
```

### 4. Integrate with Frontend

Your existing components are ready to use the backend:

- `BookmarkButton` → uses `/api/bookmarks`
- `NotesPanel` → uses `/api/notes`
- Course pages → use `lib/db/queries`
- Auth pages → use `lib/auth/session`

---

## 🚨 Troubleshooting

### Error: "relation already exists"

**Solution:** Tables already exist. You can:
- Ignore (tables are already created)
- Drop tables first (if you want clean slate)

### Error: "permission denied"

**Solution:**
- Make sure you're logged in to Dashboard as project owner
- If using psql/CLI, check database password is correct

### Error: "syntax error"

**Solution:**
- Ensure you copied ENTIRE schema.sql file
- Check no characters were lost during copy-paste

### Can't connect to database

**Solution:**
- Check firewall isn't blocking port 5432
- Verify project reference is correct
- Try manual method via Dashboard

---

## 📞 Need Help?

If you encounter issues:

1. ✅ Use **OPTION 1** (Manual via Dashboard) - most reliable
2. 📖 Check Supabase logs in Dashboard
3. 🔍 Verify .env.local has correct credentials
4. 🐛 Check browser console for errors

---

## 🎉 You're Ready!

Once schema is applied and first user created, your full-stack Supabase + Next.js backend is **LIVE** and ready for development!

**Next development tasks:**
- Create seed data (courses, modules, lessons)
- Build admin dashboard for course management
- Implement user enrollment system
- Add payment integration
- Build progress tracking UI

---

**Last Updated:** November 2024
**Project:** nodo360-plataforma
**Supabase Project:** gcahtbecfidroepelcuw
