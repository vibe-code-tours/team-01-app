---
name: docker-compose
description: Docker Compose operations for the Water Delivery stack — start, stop, logs, shell access
---

# Docker Compose

Manage the full Water Delivery Docker stack.

## Start Services

```bash
docker compose up --build       # Foreground with logs
docker compose up -d --build    # Background (detached)
```

## Stop Services

```bash
docker compose down             # Stop and remove containers
docker compose down -v          # Also remove volumes (resets DB)
```

## Logs

```bash
docker compose logs api -f      # Follow API logs
docker compose logs web -f      # Follow web logs
docker compose logs postgres    # Database logs
docker compose logs redis       # Cache logs
```

## Shell Access

```bash
docker compose exec api sh                          # API container shell
docker compose exec web sh                          # Web container shell
docker compose exec postgres psql -U postgres -d water_delivery  # DB shell
docker compose exec redis redis-cli                  # Redis shell
```

## Health Checks

```bash
docker compose ps              # Status of all services
docker compose ps postgres     # Check specific service
```
