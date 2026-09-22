# KEMIX Academy — LOCAL DEVELOPMENT WORKFLOW & OPERATIONAL RUNBOOK

**Project Name:** KEMIX Academy  
**Document Version:** 2.0.0  
**Status:** Architectural Baseline (Pre-Implementation)  
**Author:** Lead Software Architect  
**Primary Environment:** Native Windows 10/11 Workstation + Docker Desktop + WSL2 + Git  

---

## 1. Local Development Principles for Solo Developers

Developing **KEMIX Academy** locally on Windows 10/11 is designed to be frictionless, fast, and completely independent of proprietary cloud services. A solo developer must be able to boot up the entire stack, run unit and integration tests, simulate S3 file uploads, and test course authoring without spending a dollar on cloud hosting or requiring continuous internet access.

---

## 2. Prerequisites & Workstation Setup (Windows 10 / 11)

### Required Software
1. **Windows 10 / 11 (64-bit):** Pro, Enterprise, or Home with WSL2 enabled.
2. **Node.js LTS (v20 or v22):** Download official Windows `.msi` from [nodejs.org](https://nodejs.org/).
3. **Docker Desktop for Windows:** Configured with the **WSL2 backend**. Provides local PostgreSQL 16, MinIO S3 object storage, and Redis.
4. **Git for Windows:** Download from [git-scm.com](https://git-scm.com/) (Enable standard Windows Credential Manager).
5. **IDE / Code Editor:** Visual Studio Code or Cursor with extensions:
   - Prisma (`Prisma.prisma`)
   - Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
   - ESLint & Prettier

---

## 3. Local Infrastructure Evaluation: Docker Compose Services

The local development environment uses Docker Compose to orchestrate dependencies while keeping the application server running on host Node.js for instantaneous Hot Module Replacement (HMR):

```
┌─────────────────────────────────────────────────────────────┐
│                 WINDOWS 10/11 HOST MACHINE                  │
│                                                             │
│   Node.js 20 LTS (Host Runtime)                             │
│   Command: `npm run dev` (Turbopack Engine)                 │
│   URL: http://localhost:3000                                │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │             DOCKER DESKTOP (WSL2 BACKEND)           │   │
│   │                                                     │   │
│   │   1. postgres:16-alpine                             │   │
│   │      - Port: 5432:5432                              │   │
│   │      - Persistent Volume: pgdata:/var/lib/...       │   │
│   │                                                     │   │
│   │   2. minio/minio                                    │   │
│   │      - S3 API: http://localhost:9000                │   │
│   │      - Web Console: http://localhost:9001           │   │
│   │      - Persistent Volume: miniodata:/data           │   │
│   │                                                     │   │
│   │   3. redis:7-alpine                                 │   │
│   │      - Port: 6379:6379                              │   │
│   │      - In-Memory Cache & Queue Broker               │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Step-by-Step Initial Project Setup

Follow these exact steps when initializing a new local environment:

```powershell
# 1. Clone the repository from GitHub
git clone https://github.com/your-username/kemix-academy.git
cd kemix-academy

# 2. Install all dependencies deterministically
npm ci

# 3. Create your local environment configuration file
copy .env.example .env

# 4. Start local infrastructure containers in background
docker compose -f docker-compose.dev.yml up -d

# 5. Execute database migrations to build PostgreSQL schema
npx prisma migrate dev

# 6. Seed database with initial Admin user & sample courses
npm run seed

# 7. Start the development server
npm run dev
```

The application is now accessible at `http://localhost:3000`.

---

## 5. Local Object Storage Simulation (MinIO on Docker)

MinIO replicates the AWS S3 API locally on Windows without cloud expenses or network latency.

### 5.1. Starting MinIO via Docker Compose
When `docker compose up -d` executes, MinIO starts automatically with root credentials:
- **API Endpoint:** `http://localhost:9000`
- **Web Console:** `http://localhost:9001`
- **Username:** `minioadmin`
- **Password:** `minioadmin`

### 5.2. Automated Bucket Provisioning
The application seed script (`npm run seed`) automatically creates and configures the two local buckets:
- `kemix-academy-public` (Configured for public read)
- `kemix-academy-protected` (Configured for strict private read, presigned access only)

---

## 6. Master Environment Variable Blueprint (`.env.example`)

```env
# ═════════════════════════════════════════════════════════════
# KEMIX ACADEMY — MASTER ENVIRONMENT CONFIGURATION
# Copy this file to .env and replace placeholder values.
# NEVER commit the active .env file to Git or GitHub!
# ═════════════════════════════════════════════════════════════

# ── APPLICATION SETTINGS ──
NODE_ENV="development" # development | production | test
APP_NAME="KEMIX Academy"
APP_URL="http://localhost:3000"
PORT=3000

# ── DATABASE CONNECTION (PostgreSQL 16) ──
# Local Docker Compose PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kemix_academy_dev?schema=public"

# ── AUTHENTICATION & SECURITY ──
# Generate with: openssl rand -base64 32
AUTH_SECRET="insecure-local-dev-secret-replace-with-secure-32-byte-hex-in-prod"
SESSION_MAX_AGE_DAYS=30
COOKIE_SECURE="false" # Set to true in production (HTTPS)

# ── OBJECT STORAGE (S3 Standard API Abstraction) ──
# Local MinIO Settings:
S3_ENDPOINT="http://127.0.0.1:9000"
S3_REGION="us-east-1"
S3_PUBLIC_BUCKET="kemix-academy-public"
S3_PROTECTED_BUCKET="kemix-academy-protected"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_FORCE_PATH_STYLE="true" # Required true for MinIO, false for AWS S3 / Cloudflare R2
S3_PUBLIC_URL_PREFIX="http://127.0.0.1:9000/kemix-academy-public"

# Production Cloudflare R2 Example (Uncomment in production):
# S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
# S3_REGION="auto"
# S3_PUBLIC_BUCKET="kemix-academy-public"
# S3_PROTECTED_BUCKET="kemix-academy-protected"
# S3_ACCESS_KEY_ID="<r2-token-id>"
# S3_SECRET_ACCESS_KEY="<r2-secret-key>"
# S3_FORCE_PATH_STYLE="false"
# S3_PUBLIC_URL_PREFIX="https://media.kemix.academy"

# ── INITIAL SUPERADMIN CREDENTIALS (USED ONLY BY npm run seed) ──
INITIAL_ADMIN_EMAIL="admin@kemix.academy"
INITIAL_ADMIN_PASSWORD="AdminSecurePassword2026!"
INITIAL_ADMIN_NAME="Kemix Administrator"

# ── EMAIL DISPATCH (Optional for local dev, logs to console if empty) ──
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="no-reply@kemix.academy"

# ── REDIS CACHE & QUEUE (Optional: In-memory fallback if empty) ──
REDIS_URL="redis://localhost:6379"
```

---

## 7. Git & Version Control Conventions

### 7.1. Definitive `.gitignore` Specification
To guarantee that zero secrets, node modules, build artifacts, or uploaded files ever touch GitHub:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build Artifacts & Next.js
.next/
out/
build/
dist/

# Environment Variables & Secrets (CRITICAL)
.env
.env*.local
.env.production
.env.staging
*.pem
*.key
*.cert

# Database & SQLite files
*.dump
*.sql.gz
*.sqlite
*.sqlite3

# Uploaded User Files & Local Media Caches
public/uploads/
uploads/
storage-cache/
minio-data/

# Testing & Coverage
coverage/
.nyc_output/
playwright-report/
test-results/

# Logs & Debug
logs
*.log
npm-debug.log*
yarn-debug.log*

# Operating System Files
.DS_Store
Thumbs.db
desktop.ini

# IDE & Editor Directories
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
.idea/
*.swp
*.swo
```

### 7.2. Conventional Commit Standards
All git commit messages follow the Conventional Commits specification:
- `feat: add video playback speed and timestamp resume`
- `fix: resolve quiz submission score calculation edge case`
- `docs: update deployment playbook for Ubuntu 24.04`
- `refactor: extract S3 presigned URL generator into storage service`
- `test: add unit tests for certificate verification hash`
- `chore: update npm dependencies and prisma client`

### 7.3. Branching Strategy
- `main`: Production-ready, deployable code only.
- `staging`: Staging integration branch.
- `feat/<feature-name>`: Feature branches created from `main`. Merged via pull requests after automated CI checks pass.

---

## 8. Database Migration & Schema Workflow

When modifying the database schema:

```powershell
# 1. Edit the schema declaration
# File: prisma/schema.prisma

# 2. Generate and apply migration locally
npx prisma migrate dev --name add_lesson_resource_table

# 3. Prisma automatically updates the generated TypeScript client
# You can immediately use updated models with full autocomplete in VS Code

# 4. If you ever need to reset the local database from scratch:
npx prisma migrate reset # Wipes DB, reruns all migrations, and runs seed script!
```

---

## 9. Testing & Quality Assurance Runbook

```powershell
# 1. Type Check (Strict TypeScript compiler verification)
npm run typecheck # (npx tsc --noEmit)

# 2. Code Linting & Formatting Check
npm run lint

# 3. Unit & Integration Tests (Vitest)
npm run test

# 4. End-to-End (E2E) Browser Tests (Playwright)
npm run test:e2e
```

---

## 10. Decoupling from AI Tools (Antigravity Independence)

To ensure total developer sovereignty and complete portability:

1. **Antigravity is Purely a Development Assistant:** The AI does not own the code, the repository, or the deployment infrastructure.
2. **Zero Proprietary Runtime Hooks:** All code generated for KEMIX Academy adheres to open-source TypeScript, React, Next.js, and Node.js standards. There are no proprietary SDKs, vendor telemetry, or hidden platform locks.
3. **Stand-Alone Reproducibility:** Anyone can clone this repository onto a completely clean Windows or Linux machine, run `npm ci`, launch `docker compose up -d`, execute `npx prisma migrate deploy`, and run the application without installing or referencing Antigravity.
