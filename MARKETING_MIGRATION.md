# Marketing + App Split (Astro + Next.js)

## Goal
- Marketing pages move to Astro for SEO and performance.
- Dashboard remains on Next.js, hosted at the app subdomain.

## Domain plan (Option A)
- `https://pmd.com` -> Astro marketing (`pmd-marketing/`)
- `https://app.pmd.com` -> Next.js dashboard (`pmd_frontend/`)

## Environment variables
Marketing (`pmd-marketing/.env`):
- `PUBLIC_SITE_URL=https://pmd.com`
- `PUBLIC_APP_URL=https://app.pmd.com`

Dashboard (`pmd_frontend/.env`):
- `NEXT_PUBLIC_SITE_URL=https://app.pmd.com`
- `NEXT_PUBLIC_MARKETING_URL=https://pmd.com`

## Redirect map (Next.js -> marketing)
- `/` -> `/app/alerts` (dashboard home)
- `/pricing` -> `https://pmd.com/pricing`
- `/faq` -> `https://pmd.com/faq`
- `/learn` -> `https://pmd.com/learn`
- `/docs` -> `https://pmd.com/docs`
- `/blog` -> `https://pmd.com/blog`

## Deployment notes
DNS:
- `pmd.com` A/ALIAS -> marketing hosting
- `app.pmd.com` A/ALIAS -> dashboard hosting

Reverse proxy example (Caddy):
```
pmd.com {
  reverse_proxy marketing:4321
}

app.pmd.com {
  reverse_proxy frontend:3000
}
```

Reverse proxy example (Nginx):
```
server {
  server_name pmd.com;
  location / { proxy_pass http://marketing:4321; }
}

server {
  server_name app.pmd.com;
  location / { proxy_pass http://frontend:3000; }
}
```

## Moved / deleted files
Moved:
- `pmd_frontend/app/(marketing)/login` -> `pmd_frontend/app/(auth)/login`
- `pmd_frontend/app/(marketing)/register` -> `pmd_frontend/app/(auth)/register`

Deleted from Next.js:
- `pmd_frontend/app/(marketing)` (marketing routes removed)
- `pmd_frontend/app/components/marketing` (marketing-only components)

Marketing assets copied to Astro:
- `pmd_frontend/public/favicons/*` -> `pmd-marketing/public/favicons/*`
- `pmd_frontend/public/logo.png` -> `pmd-marketing/public/logo.png`
- `pmd_frontend/public/og.svg` -> `pmd-marketing/public/og.svg`

## Verification checklist
- Marketing pages render with correct SEO metadata and JSON-LD.
- `/sitemap.xml` and `/robots.txt` resolve on `pmd.com`.
- CTAs link to `https://app.pmd.com/login` and `https://app.pmd.com/register`.
- Dashboard routes remain unchanged and authenticated flows still work.
