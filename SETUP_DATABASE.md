# Supabase Database Setup Guide

Step-by-step instructions to set up the Supabase PostgreSQL database for this project.

---

## Step 1: Create a Supabase project

1) **Open Supabase**
- Go to `https://supabase.com/`
- Click **Start your project** (or **Sign in** if you already have an account)

2) **Create a new project**
- Click **New Project**
- Choose an organization (or create one)
- Fill in:
  - **Name**: `siftly` (or any name you prefer)
  - **Database Password**: choose a strong password (save it)
  - **Region**: pick the closest region
  - **Pricing plan**: Free (or Pro if needed)
- Click **Create new project**
- Wait ~2–3 minutes for provisioning

3) **Get the connection string**
- Go to **Project Settings** → **Database**
- Find **Connection string**
- Choose **URI**
- Copy the value (example):

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

Replace `[YOUR-PASSWORD]` with your actual DB password.

---

## Step 2: Set `DATABASE_URL`

### Option A (recommended): `.env` file

1) Create `.env` in the repo root:

```
E:\AMY_Technology_LLC\1-siftly\.env
```

2) Add variables:

```
DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres

# Slack Webhook URL (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Google OAuth (for Admin Login)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Session secret (use a strong random string)
SESSION_SECRET=your-random-session-secret-key-here

# Allowed Admin Emails (optional, comma-separated)
ALLOWED_ADMIN_EMAILS=admin@example.com
```

### Option B: Set env vars in your shell

**Windows (PowerShell):**

```powershell
$env:DATABASE_URL="postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres"
$env:SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**Windows (CMD):**

```cmd
set DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres
```

**macOS/Linux:**

```bash
export DATABASE_URL="postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres"
```

---

## Step 3: Install dependencies

```bash
npm install
```

Make sure `package.json` includes:
- `drizzle-orm`
- `drizzle-kit` (devDependency)
- `postgres`

---

## Step 4: Create database schema

After `DATABASE_URL` is set:

```bash
npm run db:push
```

This will:
- Read schema from `shared/schema.ts`
- Create tables in Supabase
- Create migrations as needed

---

## Step 5: Verify connectivity

1) Start the server:

```bash
npm run dev
```

2) Check logs:
- Success example:

```
Supabase PostgreSQL connected successfully
serving on port 5000
```

- If you get errors, verify:
  - `DATABASE_URL` is set correctly
  - password is correct
  - Supabase project is active (not paused)

---

## Step 6: Verify tables

After `npm run db:push`:

1) **Supabase Dashboard**
- Open your project
- Go to **Table Editor**
- You should see `users` and `contacts`

2) **SQL Editor**

```sql
SELECT * FROM users;
SELECT * FROM contacts;
```

---

## Troubleshooting

### Error: `DATABASE_URL environment variable is not set`
- Create `.env` with `DATABASE_URL`, or set it in your shell.

### Error: `password authentication failed`
- The DB password in the connection string is wrong.
- Check Supabase Dashboard → Settings → Database.

### Error: connection timeout / `ECONNREFUSED`
- Network issues, Supabase project paused, wrong host, firewall restrictions.

### Error: `relation does not exist`
- Tables are not created. Run:

```bash
npm run db:push
```

### Error: `Cannot find module 'postgres'`
- Install missing dependencies:

```bash
npm install postgres drizzle-orm drizzle-kit
```

---

## Security notes

1) **Do not commit `.env`**
- `.env` should be in `.gitignore`

2) **Protect DB credentials**
- Never hardcode secrets in code
- Prefer env vars / secret managers (Cloud Run, etc.)

3) **Backups**
- Supabase provides automatic backups depending on your plan
- You can export data or use `pg_dump` for manual backups

---

## References

- Supabase docs: `https://supabase.com/docs`
- Drizzle ORM docs: `https://orm.drizzle.team/`
- PostgreSQL docs: `https://www.postgresql.org/docs/`


