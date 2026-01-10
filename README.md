# PMD Frontend MVP

Minimal operational UI for PMD.

## Local setup
- Copy `.env.example` to `.env` and update values.
- Install dependencies: `npm install`
- Run dev server: `npm run dev`

## Docker
- `docker compose up --build`
- Open `http://localhost:3000`

## Auth + billing
- Login/register uses `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /me` on the API.
- Subscription flows use Stripe via `POST /billing/checkout-session`, `POST /billing/portal-session`, and `POST /webhooks/stripe`.
- PMD still supports API-key access for dashboard data; set the API key in the UI (stored in localStorage).

### Stripe backend env vars (FastAPI)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_BASIC_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_ELITE_PRICE_ID`
- `APP_URL` (for success/cancel URLs and portal return URL)

### Webhook setup
- Configure the Stripe webhook endpoint to `POST /webhooks/stripe`.
- Ensure idempotency and store `subscription.status`, `current_period_end`, and Stripe IDs.
