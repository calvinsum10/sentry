# FeedMe WhatsApp Pending Reply Engine (Local Edition)

Local-only backend for tracking pending merchant replies in WhatsApp groups.

## Tech Stack
- Node.js (Express)
- SQLite (via Prisma)
- Prisma ORM
- ngrok for WhatsApp webhook tunneling

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
3. Run initial migration (creates `./data/messages.db`):
   ```bash
   npx prisma migrate dev --name init
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

> Ensure the `data` folder exists at the project root. Prisma will create `data/messages.db` during migration.
> The server also auto-creates the `data/` folder at startup if missing.

> Requests are logged to stdout as JSON lines with the `http_request` event (method, url, status, responseTimeMs).

## Environment
Create a `.env` file based on `.env.example`:
```
PORT=3000
DATABASE_URL="file:./data/messages.db"
```

## ngrok & WhatsApp Webhook
1. Start ngrok to expose the local server:
   ```bash
   ngrok http 3000
   ```
2. Copy the generated HTTPS URL from ngrok.
3. Configure your WhatsApp Business webhook to point to:
   ```
   https://<ngrok-host>/webhook
   ```

## Testing the Webhook
Send a sample payload to your local server (via ngrok or directly):
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "id": "wamid.ID",
            "from": "601234567",
            "timestamp": "1708796210",
            "text": { "body": "Hello help please" },
            "group_id": "abc-group"
          }],
          "contacts": [{
            "profile": { "name": "Merchant A" }
          }]
        }
      }]
    }]
  }'
```

The webhook handler supports multiple WhatsApp messages in a single payload (it will iterate over `value.messages[]`) and normalizes timestamps whether they arrive as seconds, milliseconds, or ISO strings.

## REST API
- `GET /health` — service status
- `GET /pending` — all pending merchant messages
- `GET /groups/:id/pending` — pending merchant messages for a group
- `GET /groups/:id/messages` — full message history for a group (newest first)

## Pending Reply Logic
- Merchants are any sender **not** prefixed with `FeedMe_`. Support agents use that prefix.
- A merchant message is pending until a newer support message arrives in the same group.
- When a support message arrives, all older pending merchant messages in that group are resolved.
