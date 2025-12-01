# Docker Deployment Guide

This guide covers deploying the Crypto Newsletter using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose v2.0+ installed
- `.env` file configured (copy from `.env.example`)

## Quick Start

1. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your API keys and SMTP settings
```

2. **Build and start the container:**
```bash
docker-compose up -d
```

3. **View logs:**
```bash
docker-compose logs -f
```

4. **Stop the container:**
```bash
docker-compose down
```

## Docker Compose Configuration

The `docker-compose.yml` includes:

- **Auto-restart:** Container restarts automatically unless manually stopped
- **Timezone:** Inherits from host machine (`/etc/localtime`)
- **Volumes:**
  - Templates mounted as read-only
  - Cache persisted in named volume
  - Host timezone mounted for accurate scheduling
- **Networks:** Isolated bridge network

## Volume Management

### Cache Volume

The newsletter caches API responses to avoid rate limits:
```bash
# View cache size
docker-compose exec crypto-newsletter du -sh .cache

# Clear cache
docker-compose exec crypto-newsletter rm -rf .cache/*
```

### Template Volume

Templates are mounted from the host, so you can edit them without rebuilding:
```bash
# Edit template
nano templates/newsletter.mjml

# Restart to pick up changes
docker-compose restart
```

## Environment Variables

All configuration is via environment variables in `.env`:

**Required:**
- `OPENAI_API_KEY` - OpenAI API key
- `COINGECKO_API_KEY` - CoinGecko API key
- `CRYPTOPANIC_API_KEY` - CryptoPanic API key
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email settings
- `FROM_EMAIL` - Sender email address
- `TO_EMAILS` - Recipient email addresses (comma-separated)
- `COINS` - Cryptocurrencies to track (comma-separated)

**Optional:**
- `NEWSLETTER_TITLE` - Custom newsletter title
- `CRON_SCHEDULE` - Custom schedule (default: `0 0 * * *` = daily at midnight local time)
  - Format: `minute hour day month weekday`
  - Examples: `0 8 * * *` (8 AM), `0 */6 * * *` (every 6 hours)
  - Times are in container's timezone (inherited from host)
- `ENABLE_CACHE` - Enable API caching (default: `true`)
- `DRY_RUN` - Test mode without sending email (default: `false`)

## Logs

View real-time logs:
```bash
docker-compose logs -f crypto-newsletter
```

View last 100 lines:
```bash
docker-compose logs --tail=100 crypto-newsletter
```

## Updating

1. **Pull latest code:**
```bash
git pull
```

2. **Rebuild and restart:**
```bash
docker-compose up -d --build
```

3. **Verify:**
```bash
docker-compose logs -f
```

## Troubleshooting

### Container keeps restarting

Check logs for errors:
```bash
docker-compose logs crypto-newsletter
```

Common issues:
- Missing or invalid environment variables
- Invalid API keys
- SMTP authentication failures

### Newsletter not sending

1. **Check cron schedule and timezone:**
```bash
docker-compose exec crypto-newsletter date
# Verify timezone matches your host
```

```bash
docker-compose logs crypto-newsletter | grep "Scheduling"
# Shows configured schedule and timezone
```

2. **Test manually:**
```bash
docker-compose exec crypto-newsletter node test-pipeline.js
```

3. **Enable dry run mode:**
```bash
# Add to .env
DRY_RUN=true

# Restart
docker-compose restart
```

### Cache issues

Clear the cache:
```bash
docker-compose exec crypto-newsletter rm -rf .cache/*
# Or remove the volume
docker-compose down -v
docker-compose up -d
```

## Production Deployment

### Health Checks

Add health check to `docker-compose.yml`:
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "process.exit(0)"]
  interval: 1m
  timeout: 10s
  retries: 3
  start_period: 30s
```

### Resource Limits

Add resource constraints:
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

### Logging

Configure logging driver:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Security Best Practices

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Use secrets management** - For production, use Docker secrets or external vaults
3. **Regular updates** - Keep base image and dependencies updated
4. **Scan for vulnerabilities:**
```bash
docker scan crypto-newsletter:latest
```

## Multi-Stage Builds (Advanced)

For smaller images, use multi-stage build in `docker/Dockerfile`:
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
COPY templates/ ./templates/
CMD ["node", "src/index.js"]
```

## Backup and Restore

### Backup cache volume:
```bash
docker run --rm -v crypto-newsletter_newsletter-cache:/data -v $(pwd):/backup alpine tar czf /backup/cache-backup.tar.gz -C /data .
```

### Restore cache volume:
```bash
docker run --rm -v crypto-newsletter_newsletter-cache:/data -v $(pwd):/backup alpine tar xzf /backup/cache-backup.tar.gz -C /data
```
