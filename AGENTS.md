# Project instructions

Follow CLAUDE.md for the project stack, conventions, and product requirements.

## Secrets

Never read, search, display, or copy the contents of `.env*` files, including `.env.example`, into model context. Never expose credentials through Docker inspect, rendered Compose configuration, logs, or shell tracing. Do not bypass file restrictions using escalated commands. Applications and Docker Compose may consume `.env` internally when the user requests running the project; do not print secret values.
