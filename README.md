# Saim — public log

A story-first public portfolio with a practical logging studio.

## Run locally

```bash
npm install
npm run dev
```

Open `/` for the public record and `/studio` to add entries. Entries are stored in `data/entries.json`.

For a deployed version, set `ADMIN_KEY`. The studio sends the key with write requests. File storage is intentionally local-first for this prototype; move the entry store to PostgreSQL or Supabase before deploying to a serverless host.
