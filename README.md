# PMD Dashboard

## Overview
Next.js dashboard for viewing alerts, Copilot runs, and billing for PMD users.
It talks to the backend API defined by `NEXT_PUBLIC_API_BASE_URL`.

## Quickstart
- Use the infra dev stack (recommended):

```bash
cd ../pmd_infra
cp env/dev.env.example .env
./scripts/dev.sh
```

- Open `http://localhost:3000`.

## Configuration
- Required public vars: NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_TELEGRAM_BOT_USERNAME.
- See `../pmd_infra/env/dev.env.example` for values and notes.

## Links
- API base URL config: `../pmd_infra/env/dev.env.example`
- Infra runbook: `../pmd_infra/README.md`
- Pages: Alerts, Copilot, Settings, Billing, Telegram
