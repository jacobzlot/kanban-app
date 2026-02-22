# My Kanban Board

A personal Kanban board web app, styled after Kanbanchi. No login required — single user.

## Tech Stack
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Frontend:** Vanilla HTML/CSS/JS (served by Express)
- **Hosting:** Railway

---

## Deploy to Railway

### 1. Create a Railway account
Go to [railway.app](https://railway.app) and sign up.

### 2. Create a new project
- Click **New Project** → **Deploy from GitHub repo**
- Push this folder to a GitHub repo first, then connect it

  OR

- Click **New Project** → **Empty Project**, then use the Railway CLI:
  ```bash
  npm install -g @railway/cli
  railway login
  railway link   # link to your project
  railway up     # deploy
  ```

### 3. Add a PostgreSQL database
- In your Railway project, click **+ New** → **Database** → **Add PostgreSQL**
- Railway will automatically inject `DATABASE_URL` into your app's environment

### 4. Set environment variables
Railway auto-sets `DATABASE_URL` when you add Postgres. That's all you need.

### 5. Deploy
The app will auto-deploy. The database tables are created automatically on first run.

---

## Local Development

```bash
# Install dependencies
npm install

# Start a local Postgres instance (or use Railway's connection string)
export DATABASE_URL=postgresql://user:pass@localhost:5432/kanban

# Run the app
npm start
# or for hot-reload:
npm run dev
```

Open http://localhost:3000

---

## Features
- ✅ Drag & drop cards between columns
- ✅ Add / edit / delete cards
- ✅ Add / edit / delete columns
- ✅ Priority levels (Low, Normal, High, Critical)
- ✅ Progress bar per card (0–100%)
- ✅ Status (Active / Done)
- ✅ Color-coded tags
- ✅ Start & due dates with overdue highlighting
- ✅ Column color theming
- ✅ Persistent storage in PostgreSQL
- ✅ Board stats in header
