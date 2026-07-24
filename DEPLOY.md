# Deploying Taskify to Render (free)

This gives you a public HTTPS link (e.g. `https://taskify-xxxx.onrender.com`) that
anyone can open on any phone or computer.

## Prerequisites
- A **GitHub** account (free) — https://github.com
- A **Render** account (free) — https://render.com  (sign up with GitHub)
- Your **MongoDB Atlas** connection string (already in your `.env`)
- Atlas **Network Access** must allow `0.0.0.0/0` (already done)

## Step 1 — Put the code on GitHub
1. Create a new **empty** repository on GitHub (e.g. `taskify`). Don't add a README.
2. In this project folder, run (replace the URL with your repo's):
   ```bash
   git init
   git add .
   git commit -m "Taskify: to-do app with auth"
   git branch -M main
   git remote add origin https://github.com/<your-username>/taskify.git
   git push -u origin main
   ```
   > `.env` and `node_modules/` are git-ignored, so your DB password is NOT uploaded.

## Step 2 — Deploy on Render
1. Go to https://dashboard.render.com → **New +** → **Web Service**.
2. Connect your GitHub and pick the `taskify` repo.
3. Render auto-detects Node. Confirm:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Open **Environment** and add:
   | Key              | Value                                             |
   | ---------------- | ------------------------------------------------- |
   | `MONGODB_URI`    | *your Atlas connection string (with password)*    |
   | `SESSION_SECRET` | *any long random string*                          |
   (Leave the `GOOGLE_*` variables empty unless you set up Google login.)
5. Click **Create Web Service**. First build takes a few minutes.

## Step 3 — Use it
When it says **Live**, open the `…onrender.com` URL on any phone. Each person
signs up with their own email and manages their own private tasks and profile picture.

### Notes
- Free Render services **sleep after 15 min idle**; the first request then takes
  ~30–50s to wake. That's normal on the free tier.
- To update the site later: `git add . && git commit -m "changes" && git push` —
  Render redeploys automatically.
