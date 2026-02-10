# EOIR Gateway

A simple web application that provides secure access to the EOIR portal via VPN IP verification.

## How It Works

1. User opens the site
2. Server checks the user's IP address
3. If the IP matches the VPN IP list → credentials are provided + EOIR link is activated
4. If the IP doesn't match → "Turn on VPN" warning is shown

## Tampermonkey Userscript

The gateway serves a Tampermonkey userscript that automatically fills in email, password, and OTP on the Okta login page. The script:

- Detects the current login phase (email, password, or OTP)
- Fills credentials fetched from the gateway API (VPN required)
- Fetches OTP codes from a Slack webhook and auto-submits
- Clears cookies on the EOIR portal for fresh sessions
- Uses randomized delays to simulate human interaction

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "EOIR Gateway"
git remote add origin https://github.com/USERNAME/eoir-gateway.git
git push -u origin main
```

### 2. Import on Vercel

- [vercel.com](https://vercel.com) → New Project → Select GitHub repo → Import

### 3. Environment Variables (Vercel Dashboard)

Settings → Environment Variables → add the following:

| Key | Value |
|-----|-------|
| `ALLOWED_VPN_IPS` | `203.0.113.50,198.51.100.25` (your VPN IPs, comma-separated) |
| `EOIR_EMAIL` | EOIR login email |
| `EOIR_PASSWORD` | EOIR login password |
| `EOIR_URL` | `https://portal.eoir.justice.gov/` |

### 4. Deploy

Vercel deploys automatically. Every push triggers a new deployment.

## Local Development

```bash
cp .env.example .env.local
# Edit .env.local with your values
npm install
npm run dev
```

## Security Notes

- Credentials are stored server-side only and are never sent to the client unless the IP matches.
- Vercel environment variables are encrypted.
- Keep the Vercel project set to **private**.
