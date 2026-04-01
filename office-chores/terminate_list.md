# Implementation & Deployment Plan: Office-Chores + Google OAuth + AWS (Free)

## Context

Add Google OAuth authentication to the office-chores app and deploy it on AWS at zero cost. The free deployment avoids Route 53 (paid) by using a DuckDNS free subdomain + Let's Encrypt for HTTPS. Authentication uses Google OAuth via Passport.js (always free). Compute is a single EC2 t2.micro (free for 12 months). SQLite stays on EBS (free). nginx runs on the same instance as a reverse proxy for HTTPS termination and SSE support.

---

## Final Architecture

```
Browser
  │
  ▼ HTTPS (port 443)
nginx on EC2 t2.micro  ←──── Let's Encrypt cert (free)
  │ proxy_pass localhost:3001
  ▼ HTTP (port 3001, internal only)
Express.js (Node.js)
  ├── Google OAuth routes (/api/auth/google, /api/auth/google/callback)
  ├── Session middleware (express-session + SQLite store)
  ├── Protected API routes (/api/team, /api/chores, /api/calendar, /api/instances)
  ├── SSE endpoint (/api/events)
  └── Static React build (express.static)
         │
         ▼
    SQLite on EBS (chores.db)
```

---

## Free Resources Summary

| Resource | Purpose | Cost |
|----------|---------|------|
| EC2 t2.micro | Runs nginx + Express + React build | ✅ Free — 750 hrs/month, 12 months |
| EBS 8 GB | OS + SQLite database | ✅ Free — 30 GB included |
| Elastic IP | Stable public IP for DuckDNS | ✅ Free while attached to running instance |
| DuckDNS subdomain | Free domain e.g. `office-chores.duckdns.org` | ✅ Always free |
| Let's Encrypt (Certbot) | Free SSL/TLS certificate | ✅ Always free, auto-renews |
| nginx | Reverse proxy, HTTPS termination, SSE config | ✅ Free open-source software |
| Security Group | Firewall (ports 443, 80, 22) | ✅ Always free |
| SSM Parameter Store | Stores OAuth client secret, session secret | ✅ Always free (standard params) |
| IAM Role | Lets EC2 read SSM params | ✅ Always free |
| Google OAuth | User authentication | ✅ Always free, no limits |
| **Total** | | **$0/month** |

> After 12 months, EC2 t2.micro costs ~$8.47/month. Everything else stays free.

---

## Part 1: Code Changes

### 1.1 — Backend: Environment Variables

All secrets must come from environment variables, not hardcoded values.

**File: `server/server.js`**
- Read `PORT` from env (already done)
- Read `SESSION_SECRET` from env
- Read `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` from env
- Read `CORS_ORIGIN` from env

**File: `server/app.js`**
- Replace `cors()` (open) with `cors({ origin: process.env.CORS_ORIGIN, credentials: true })`

---

### 1.2 — Backend: Google OAuth + Session Auth

**New npm packages to install in `server/`:**
- `passport` — authentication middleware
- `passport-google-oauth20` — Google OAuth 2.0 strategy
- `express-session` — server-side session management
- `better-sqlite3-session-store` — stores sessions in the existing SQLite DB

**New file: `server/auth.js`**
- Configure `passport.use(new GoogleStrategy(...))` with client ID/secret and callback URL
- `passport.serializeUser` / `passport.deserializeUser` to store user in session
- Export configured passport instance

**New file: `server/routes/auth.js`**
- `GET /api/auth/google` — initiates OAuth flow (redirects to Google)
- `GET /api/auth/google/callback` — handles Google redirect, creates session, redirects to frontend
- `GET /api/auth/logout` — destroys session, redirects to login
- `GET /api/auth/me` — returns current user info (or 401 if not logged in)

**New file: `server/middleware/requireAuth.js`**
- Middleware that checks `req.isAuthenticated()`
- If not authenticated → returns 401 JSON response

**Modified: `server/app.js`**
- Add `express-session` middleware (before routes)
- Add `passport.initialize()` and `passport.session()` middleware
- Mount auth routes at `/api/auth` (public — no requireAuth)
- Apply `requireAuth` middleware to all other `/api/*` routes
- Mount `/api/events` (SSE) with `requireAuth`

---

### 1.3 — Frontend: API Base URL + Auth Flow

**File: `client/vite.config.js`** (dev only — no change needed for prod)
- Proxy stays as-is for local development

**File: `client/src/api/client.js`**
- Add `credentials: 'include'` to all fetch calls (required for session cookies to work cross-origin)
- Add a base URL prefix: `const BASE = import.meta.env.VITE_API_BASE_URL ?? ''`
- Prefix all fetch calls with `BASE`
- Handle 401 responses: redirect to `${BASE}/api/auth/google`

**New file: `client/src/components/LoginButton.jsx`**
- Simple component with a "Sign in with Google" button
- Renders when `useAuth` hook returns unauthenticated

**New hook: `client/src/hooks/useAuth.js`**
- Calls `GET /api/auth/me` on mount
- Returns `{ user, loading, isAuthenticated }`

**Modified: `client/src/App.jsx`**
- Wrap app in auth check: if `!isAuthenticated` and not loading → show login screen
- If authenticated → render existing `<App>` content

**New file: `client/.env.production`**
```
VITE_API_BASE_URL=https://office-chores.duckdns.org
```

---

## Part 2: AWS Infrastructure Setup

### Step 1 — Launch EC2 t2.micro

- **AMI**: Amazon Linux 2023 (free tier eligible)
- **Instance type**: t2.micro
- **Key pair**: Create a new key pair, download `.pem` file
- **Storage**: 8 GB gp3 (default — free tier includes 30 GB)
- **Security Group** rules:
  | Port | Protocol | Source | Purpose |
  |------|----------|--------|---------|
  | 22 | TCP | Your IP only | SSH access |
  | 80 | TCP | 0.0.0.0/0 | HTTP (redirects to HTTPS) |
  | 443 | TCP | 0.0.0.0/0 | HTTPS traffic |

### Step 2 — Allocate & Attach Elastic IP

- EC2 Console → Elastic IPs → Allocate Elastic IP → Associate with the t2.micro instance
- This gives a stable IP that won't change when the instance stops/starts

### Step 3 — IAM Role for SSM Access

- IAM Console → Roles → Create Role → EC2 use case
- Attach policy: `AmazonSSMReadOnlyAccess`
- Attach this role to the EC2 instance
- This lets the server read secrets from SSM Parameter Store without hardcoding credentials

### Step 4 — Store Secrets in SSM Parameter Store

In AWS Console → Systems Manager → Parameter Store, create these **SecureString** parameters (encrypted, free):

| Parameter Name | Value |
|----------------|-------|
| `/office-chores/SESSION_SECRET` | A long random string (e.g., 64-char hex) |
| `/office-chores/GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `/office-chores/GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `/office-chores/GOOGLE_CALLBACK_URL` | `https://office-chores.duckdns.org/api/auth/google/callback` |
| `/office-chores/CORS_ORIGIN` | `https://office-chores.duckdns.org` |

### Step 5 — DuckDNS Free Subdomain

1. Go to duckdns.org → log in with any account (GitHub, Google, etc.)
2. Create a subdomain: e.g., `office-chores` → gives `office-chores.duckdns.org`
3. Set the IP to your Elastic IP address
4. Done — no cost, no expiry

> DuckDNS subdomains are permanent and free. The domain points to your Elastic IP.

---

## Part 3: Server Setup (on EC2 via SSH)

### Install Dependencies

```bash
# Update system
sudo dnf update -y

# Install Node.js 20
sudo dnf install -y nodejs npm

# Install nginx
sudo dnf install -y nginx

# Install git
sudo dnf install -y git

# Install certbot for Let's Encrypt
sudo dnf install -y certbot python3-certbot-nginx
```

### Clone & Install App

```bash
git clone https://github.com/your-username/office-chores.git /home/ec2-user/office-chores
cd /home/ec2-user/office-chores/server
npm install
cd ../client
npm install
npm run build  # produces client/dist/
```

### Fetch Secrets from SSM & Create .env

```bash
# Run once to populate .env file from SSM
aws ssm get-parameters-by-path \
  --path /office-chores \
  --with-decryption \
  --query "Parameters[*].[Name,Value]" \
  --output text | awk '{print substr($1,18)"="$2}' > /home/ec2-user/office-chores/server/.env
```

The `.env` file will contain:
```
SESSION_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=...
CORS_ORIGIN=...
PORT=3001
```

### Configure nginx

**File: `/etc/nginx/conf.d/office-chores.conf`**
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name office-chores.duckdns.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name office-chores.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/office-chores.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/office-chores.duckdns.org/privkey.pem;

    # SSE-compatible proxy settings (critical for /api/events)
    location /api/events {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
        add_header X-Accel-Buffering no;
    }

    # All other API routes
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # React SPA — served by Express via express.static
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }
}
```

### Get Let's Encrypt Certificate

```bash
sudo certbot --nginx -d office-chores.duckdns.org --non-interactive --agree-tos -m your@email.com
```

Certbot auto-configures nginx and auto-renews the cert every 90 days. No action needed after initial setup.

### Run Express as a systemd Service

**File: `/etc/systemd/system/office-chores.service`**
```ini
[Unit]
Description=Office Chores App
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/office-chores/server
EnvironmentFile=/home/ec2-user/office-chores/server/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable office-chores
sudo systemctl start office-chores
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## Part 4: Google Cloud Console Setup

1. Go to console.cloud.google.com
2. Create a new project: "Office Chores"
3. APIs & Services → OAuth consent screen:
   - User type: **External**
   - App name: "Office Chores"
   - Add your Gmail as a test user (and teammates' emails)
   - Scopes: `email`, `profile` (default)
4. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Authorized redirect URI: `https://office-chores.duckdns.org/api/auth/google/callback`
5. Copy Client ID and Client Secret → paste into SSM Parameter Store

> While the app is in "Testing" mode on Google (not published), only listed test users can log in. This is fine for an internal office tool — no need to publish.

---

## Part 5: Verification

| Check | How to verify |
|-------|--------------|
| App is live | Open `https://office-chores.duckdns.org` in browser |
| HTTPS works | Padlock icon in browser, cert issued by Let's Encrypt |
| Google login works | Click "Sign in with Google", authenticate, lands on app |
| Logout works | Session destroyed, redirected to login |
| Unauthorized access blocked | Open API URL directly (`/api/team`) without session → 401 |
| SSE works | Open app in two browser tabs, add a chore in one, see it appear in the other |
| App survives reboot | `sudo reboot`, then re-open app — should be running (systemd auto-start) |
| Cert auto-renews | `sudo certbot renew --dry-run` — should succeed |

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `server/app.js` | Add session, passport, requireAuth middleware; lock CORS |
| `server/server.js` | Load env vars; use `.env` file in production |
| `server/routes/auth.js` | New — Google OAuth routes |
| `server/auth.js` | New — Passport strategy config |
| `server/middleware/requireAuth.js` | New — session check middleware |
| `client/src/api/client.js` | Add `credentials: include`, base URL, 401 redirect |
| `client/src/App.jsx` | Wrap in auth check |
| `client/src/hooks/useAuth.js` | New — auth state hook |
| `client/.env.production` | New — `VITE_API_BASE_URL` |

---

## Termination Plan (When Done with AWS Deployment)

### Important: GitHub Pages Limitation

GitHub Pages hosts **static files only** — it can run the React frontend but **cannot run the Express backend or SQLite database**. When all AWS resources are terminated, the app's functionality (chores, team members, real-time sync) will stop working because there is no API server. The GitHub Pages deployment will show the frontend UI only but all API calls will fail.

If you want the app to remain fully functional without AWS costs at a future point, the backend would need to be moved to a serverless/free option (e.g., Railway free tier, Render free tier). This is a separate concern — just be aware of this before terminating.

---

### Complete List of Resources to Terminate

When you give the instruction to terminate, here is every resource that will be cleaned up. Use this list to manually verify everything is gone.

#### AWS Resources

| # | Resource | Where to Verify in AWS Console | Potential Charge if Not Deleted |
|---|----------|-------------------------------|-------------------------------|
| 1 | **EC2 Instance** (t2.micro) | EC2 → Instances | ~$8.47/month after 12 months free |
| 2 | **EBS Volume** (8 GB gp3) | EC2 → Volumes | ~$0.64/month after 12 months free |
| 3 | **Elastic IP** | EC2 → Elastic IPs | $0.005/hr (~$3.60/month) if not released |
| 4 | **Security Group** | EC2 → Security Groups | Free — but delete to keep account clean |
| 5 | **IAM Role** | IAM → Roles | Free — but delete to keep account clean |
| 6 | **SSM Parameters** (5 params) | Systems Manager → Parameter Store | Free — but delete to remove secrets |
| 7 | **AWS Account itself** | N/A | Free to have, but close if not using AWS at all |

> EBS volume: by default AWS checks "Delete on Termination" when you terminate an EC2 instance — the volume is deleted automatically. Verify under EC2 → Volumes that no volume remains in "available" state after termination.

> Elastic IP: terminating the EC2 instance does NOT automatically release the Elastic IP. You must manually release it. An unattached Elastic IP costs ~$3.60/month — this is the most common forgotten charge.

#### Google Cloud Resources

| # | Resource | Where to Verify | Potential Charge if Not Deleted |
|---|----------|----------------|-------------------------------|
| 8 | **OAuth 2.0 Client ID** | Google Cloud Console → APIs & Services → Credentials | Free — but delete to revoke access |
| 9 | **OAuth Consent Screen** | Google Cloud Console → APIs & Services → OAuth consent screen | Free — delete when removing project |
| 10 | **GCP Project** | Google Cloud Console → Project selector (top bar) | Free to have — but delete the whole project to cleanly remove everything |

> Deleting the GCP project removes all credentials and OAuth configs in one step. This is the cleanest approach.

#### Free Resources (No Charge, But Clean Up)

| # | Resource | Where to Clean Up | Notes |
|---|----------|-------------------|-------|
| 11 | **DuckDNS subdomain** | duckdns.org → your account | Free forever, just delete the subdomain |
| 12 | **Let's Encrypt cert** | Lives on the EC2 instance | Gone automatically when EC2 is terminated |

---

### Termination Order (When You Give the Instruction)

Claude will execute these steps in this order:

1. **AWS**: Stop the EC2 instance → Terminate the EC2 instance
2. **AWS**: Verify EBS volume is deleted (check EC2 → Volumes)
3. **AWS**: Release the Elastic IP (EC2 → Elastic IPs → Release)
4. **AWS**: Delete the Security Group
5. **AWS**: Delete the IAM Role
6. **AWS**: Delete all 5 SSM Parameter Store entries
7. **Google Cloud**: Delete the GCP Project (removes OAuth client + consent screen in one step)
8. **DuckDNS**: Delete the subdomain
9. **GitHub**: Deploy React frontend to GitHub Pages (frontend-only shell, no backend)

---

### Your Manual Verification Checklist (After Termination)

After Claude terminates all resources, verify these yourself:

- [ ] EC2 → Instances: No instances in "running" or "stopped" state
- [ ] EC2 → Volumes: No volumes in "available" state (should be empty or only system volumes)
- [ ] EC2 → Elastic IPs: No allocated Elastic IPs listed
- [ ] EC2 → Security Groups: Only the default security group remains (AWS creates this; it's free and can't be deleted)
- [ ] IAM → Roles: No `office-chores` role
- [ ] Systems Manager → Parameter Store: No `/office-chores/*` parameters
- [ ] Google Cloud Console → Project list: No "Office Chores" project
- [ ] DuckDNS → Your domains: No `office-chores` subdomain
