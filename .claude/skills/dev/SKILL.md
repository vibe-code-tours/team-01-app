---
name: dev
description: Start all Docker development services (PostgreSQL, Redis, API, Web) with hot-reload
---

# Dev

Start the full Docker development environment.

```bash
docker compose up --build
```

To run in background:

```bash
docker compose up -d --build
```

Checks that all 5 services are healthy before returning.
