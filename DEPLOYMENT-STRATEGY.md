# KEMIX Academy — DEPLOYMENT STRATEGY & HOSTING-AGNOSTIC PLAYBOOK

**Project Name:** KEMIX Academy  
**Document Version:** 2.0.0  
**Status:** Architectural Baseline (Pre-Implementation)  
**Author:** Lead Software Architect  
**Target Infrastructure:** Any Standard Linux Server (Ubuntu 22.04 / 24.04 LTS), OCI Container Platform, or Bare-Metal VPS  

---

## 1. Hosting-Agnostic Deployment Philosophy

**KEMIX Academy** adheres strictly to the Twelve-Factor App methodology. The application is packaged as a standard, stateless container or standalone Node.js process that can run identically on:
- A $5 to $20/month Ubuntu VPS (Hetzner, DigitalOcean, Linode, Vultr, OVH).
- An open-source, self-hosted PaaS (Coolify, Dokku, CapRover).
- Modern managed container clouds (AWS ECS, Google Cloud Run, DigitalOcean App Platform, Render, Railway).
- On-premises bare-metal servers.

**Zero Proprietary Cloud Hooks:** There are no vendor-specific SDKs, no proprietary serverless edge requirements, no platform-dependent build steps, and zero runtime dependencies on AI coding tools like Antigravity.

---

## 2. Multi-Environment Topology

```mermaid
flowchart LR
    subgraph LocalDev["1. Local Development (Windows 10/11)"]
        WinHost["Windows Host (VS Code/Cursor)"]
        DockerWSL["Docker Desktop (WSL2 Backend)\n- postgres:16-alpine\n- minio/minio\n- redis:7-alpine"]
        NodeDev["Node.js 20 LTS (npm run dev)"]
        WinHost --> NodeDev
        NodeDev --> DockerWSL
    end

    subgraph StagingEnv["2. Staging / Preview (Optional)"]
        StagingVPS["Linux Staging Server"]
        StagingApp["KEMIX Academy Staging Container"]
        StagingDB[("Staging PostgreSQL")]
        StagingS3[("Staging S3 Bucket")]
        StagingVPS --> StagingApp
        StagingApp --> StagingDB
        StagingApp --> StagingS3
    end

    subgraph ProductionEnv["3. Production (Linux Server / Cloud)"]
        NginxProxy["Nginx Reverse Proxy + SSL (Certbot)"]
        ProdApp1["KEMIX Academy App Container"]
        ProdDB[("Managed or Self-Hosted PostgreSQL 16")]
        ProdS3[("S3 Storage (Cloudflare R2 / AWS S3)")]
        NginxProxy -->|HTTP/Port 3000| ProdApp1
        ProdApp1 --> ProdDB
        ProdApp1 --> ProdS3
    end

    LocalDev -->|Git Push to GitHub| GitHubRepo["GitHub Repository"]
    GitHubRepo -->|GitHub Actions CI/CD| StagingEnv
    GitHubRepo -->|GitHub Actions CI/CD (Tagged Release)| ProductionEnv
```

---

## 3. Production Deployment Topologies

### 3.1. Recommended Option A: Linux VPS with Docker Compose & Nginx (Highest Value & Portability)
- **Target Server:** 2 vCPU, 4GB RAM Ubuntu 24.04 LTS (Cost: ~$6 - $12/month on Hetzner or DigitalOcean).
- **Components:**
  1. `nginx`: Handles SSL termination via Let's Encrypt (Certbot), gzip/brotli compression, rate limiting, and reverse proxy to port 3000.
  2. `kemix-academy-app`: Minimal Alpine Linux Node.js container running Next.js standalone server.
  3. `postgres`: Managed PostgreSQL instance (recommended) OR containerized PostgreSQL 16 with persistent volume mounts.
- **Benefits:** Complete operational control, low cost, reproducible on any cloud.

### 3.2. Recommended Option B: Open-Source Self-Hosted PaaS (Coolify / Dokku)
- **Target:** Ubuntu VPS running Coolify.
- **Workflow:** Push to GitHub `main` branch -> Coolify detects webhook -> pulls repository -> runs multi-stage Docker build -> executes Prisma migrations -> performs zero-downtime rolling restart.
- **Benefits:** Heroku/Vercel-like developer experience on your own independent VPS with zero SaaS fees.

### 3.3. Option C: Managed Container Service (AWS ECS / GCP Cloud Run / Render)
- **Workflow:** Build OCI container in GitHub Actions -> push image to Docker Hub / GitHub Container Registry (GHCR) -> trigger container deployment.
- **Benefits:** Fully managed infrastructure, automatic autoscaling.

---

## 4. Multi-Stage Dockerfile Blueprint (Specification)

```dockerfile
# ── STAGE 1: Dependency Installation ──
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── STAGE 2: Build & Compilation ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Generate Prisma Client
RUN npx prisma generate
# Compile Next.js standalone application
RUN npm run build

# ── STAGE 3: Production Minimal Runner ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user for security hardening
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public static assets and standalone bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
```

---

## 5. Continuous Integration & Deployment (CI/CD) with GitHub Actions

### 5.1. CI Workflow: Automated Verification Pipeline (`.github/workflows/ci.yml`)
Triggered on all pull requests and pushes to `main`:
1. **Checkout Code:** Pulls full repository from GitHub.
2. **Environment Setup:** Installs Node.js 20 LTS with npm cache.
3. **Static Analysis & Linting:** Runs `npm run lint` (ESLint) and Prettier format verification.
4. **TypeScript Typecheck:** Runs `npx tsc --noEmit` to verify type integrity.
5. **Automated Unit & Integration Tests:** Executes Vitest test suite.
6. **Container Build Verification:** Verifies the multi-stage Docker build succeeds without errors.

### 5.2. CD Workflow: Automated Production Deployment (`.github/workflows/deploy.yml`)
Triggered on tagged production releases (e.g., `v1.0.0`) or merged commits to `main`:
1. Authenticates via SSH Key (stored in GitHub Repository Secrets).
2. Connects to the production server.
3. Executes zero-downtime deployment script:
   ```bash
   cd /opt/kemix-academy
   git pull origin main
   docker compose build app
   # Execute database migrations inside an ephemeral runner
   docker compose run --rm app npx prisma migrate deploy
   # Seamless reload without dropping connections
   docker compose up -d --no-deps --remove-orphans app
   ```

---

## 6. Custom Domain, DNS & SSL Configuration

### 6.1. DNS Record Configuration
When connecting your custom domain (e.g., `kemix.academy` or `lms.kemix.academy`):

| Type | Name / Host | Target / Value | Purpose |
| :--- | :--- | :--- | :--- |
| **A** | `@` (Root) | `YOUR_SERVER_IPV4` | Primary web traffic |
| **AAAA** | `@` (Root) | `YOUR_SERVER_IPV6` (Optional) | IPv6 traffic |
| **CNAME** | `www` | `kemix.academy` | Alias redirect to root |
| **CNAME** | `media` | `<r2-or-s3-public-cname>` | Optional custom CDN domain for public assets |

### 6.2. Automated SSL/TLS (Let's Encrypt + Certbot)
Automated TLS certificate generation and renewal:
```bash
certbot --nginx -d kemix.academy -d www.kemix.academy --non-interactive --agree-tos -m admin@kemix.academy
```
Certbot automatically configures auto-renewal cron jobs (`certbot renew --dry-run`).

---

## 7. Zero-Downtime Deployment & Database Migration Protocol

Executing database migrations in production requires strict sequencing to avoid locking tables or serving broken code:

```
Step 1: Code Push & Build
        Build new container image in background. Old container continues serving traffic.
        
Step 2: Backward-Compatible Migration
        Run `npx prisma migrate deploy` via migration container.
        Prisma applies additive schema changes (new tables, new nullable columns).
        
Step 3: Container Swap
        Start new application container.
        Verify health check: `GET /api/health` returns 200 OK.
        Nginx switches upstream proxy traffic to new container.
        
Step 4: Graceful Shutdown
        Old application container finishes existing in-flight HTTP requests and shuts down.
```

---

## 8. Observability, Health Checks & Monitoring

### 8.1. Application Health Check Endpoint (`/api/health`)
A dedicated, unauthenticated health check endpoint:
```json
{
  "status": "healthy",
  "appName": "KEMIX Academy",
  "timestamp": "2026-09-19T12:00:00.000Z",
  "uptime": 86400,
  "database": "connected",
  "storage": "connected"
}
```
If PostgreSQL fails to respond to `SELECT 1` or S3 head-bucket fails, the endpoint returns `503 Service Unavailable`, alerting monitoring services.

### 8.2. External Uptime Monitoring
Connect a free/open-source external monitor (e.g., Uptime Kuma, Better Stack, or Pingdom) to ping `https://kemix.academy/api/health` every 60 seconds, dispatching alerts via Telegram, Discord, or Email if downtime occurs.

---

## 9. Provider Migration Playbook: Moving Providers in Under 1 Hour

If you ever decide to move KEMIX Academy from one hosting provider (e.g., DigitalOcean) to another (e.g., Hetzner or AWS), follow this exact protocol:

### Phase 1: Database Transfer (10 minutes)
1. Set application to maintenance mode on old server.
2. Dump PostgreSQL database:
   ```bash
   pg_dump -Fc -h $OLD_DB_HOST -U $DB_USER $DB_NAME > /tmp/kemix_live.dump
   ```
3. Transfer dump file to new database server via `scp`:
   ```bash
   scp /tmp/kemix_live.dump user@new-server-ip:/tmp/
   ```
4. Restore into new PostgreSQL instance:
   ```bash
   pg_restore -c -h $NEW_DB_HOST -U $NEW_DB_USER -d $NEW_DB_NAME /tmp/kemix_live.dump
   ```

### Phase 2: Object Storage Sync (5 minutes)
If changing S3 providers (e.g., MinIO to Cloudflare R2):
Use `rclone` (the universal open-source cloud sync tool):
```bash
rclone sync old-s3:kemix-academy-protected new-s3:kemix-academy-protected -P
rclone sync old-s3:kemix-academy-public new-s3:kemix-academy-public -P
```

### Phase 3: Launch New App Server (10 minutes)
1. Clone your Git repository onto the new server:
   ```bash
   git clone https://github.com/your-username/kemix-academy.git /opt/kemix-academy
   ```
2. Copy your production `.env` file (updating the `DATABASE_URL` and `S3_*` values if modified).
3. Start the application:
   ```bash
   docker compose up -d --build
   ```

### Phase 4: DNS Switch (5 minutes)
1. Update your domain's **A Record** to the IP address of the new server.
2. Issue new SSL certificate with Certbot on the new server.
3. Verify application health at `/api/health`.
4. Decommission old server.

**Result:** Migration completed with zero code changes, zero vendor dependency negotiations, and complete data integrity preserved.
