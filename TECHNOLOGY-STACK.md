# KEMIX Academy — TECHNOLOGY STACK EVALUATION & SPECIFICATION

**Project Name:** KEMIX Academy  
**Document Version:** 2.0.0  
**Status:** Architectural Baseline (Pre-Implementation)  
**Author:** Lead Software Architect  
**Persona:** Solo Full-Stack Engineer on Windows 10/11 (Docker Desktop + WSL2) developing for Linux Production  

---

## 1. Executive Summary & Stack Selection Criteria

Choosing a technology stack for **KEMIX Academy** requires balancing three non-negotiable principles:
1. **Solo-Developer Velocity:** Maximum productivity, unified language, shared types, minimal boilerplate, low maintenance burden.
2. **Total Ownership & Zero Vendor Lock-in:** 100% open-source standards, self-hostable anywhere, easily swappable components.
3. **Rock-Solid Portability:** Seamless local development on Windows 10/11 with Docker Desktop and WSL2, identical runtime behavior on Linux production servers, and zero runtime dependencies on AI coding platforms (such as Antigravity).

### Selected Stack Summary Table

| Domain | Technology Chosen | Runtime / Specification | Primary Reason |
| :--- | :--- | :--- | :--- |
| **Language** | TypeScript 5+ | Node.js 20+ LTS | End-to-end type safety from DB to UI |
| **Fullstack Framework** | Next.js (App Router, Standalone) | React 18+ Server Components | Unified fullstack, SEO for catalog, SSR + API |
| **Styling & Design System** | Tailwind CSS v4 + shadcn/ui | Radix UI Primitives | Accessible, zero-runtime CSS, fully owned UI code |
| **Animations & Interactions** | Framer Motion + Lucide React | Modern Web Animations API | Fluid micro-interactions, low bundle overhead |
| **Database Engine** | PostgreSQL 16+ | Standard Relational SQL | Enterprise data integrity, JSON support, universal |
| **ORM & Migrations** | Prisma ORM | Declarative Schema & SQL | Typed migrations, cross-platform CLI, readable models |
| **Authentication** | Self-Hosted Session Engine | Argon2id + HttpOnly Cookies | Zero 3rd-party auth lock-in, self-hosted in DB |
| **Validation Layer** | Zod | TypeScript Schema Validation | Runtime safety across API, forms, and env vars |
| **Object Storage Client** | `@aws-sdk/client-s3` | S3 Standard API | Works identically with MinIO, Cloudflare R2, AWS S3 |
| **File Upload Pipeline** | Direct-to-S3 Presigned URLs | HTTP PUT directly to Bucket | Zero server RAM/bandwidth exhaustion on videos |
| **Certificate Engine** | `pdf-lib` | Pure JavaScript PDF Engine | Cross-platform, zero native C++ or headless Chrome |
| **Testing** | Vitest + Playwright | Unit, Integration & E2E | Fast execution, native TypeScript, browser testing |
| **Logging & Metrics** | Pino + OpenTelemetry Standards | Structured JSON Logging | High performance, non-blocking, zero lock-in |
| **Job Queue & Caching** | BullMQ + Redis 7 (Modular) | Background Worker Queue | Asynchronous PDF generation, email dispatch |
| **Containerization** | Docker & Docker Compose | Multi-Stage OCI Containers | 100% environment parity Windows/Linux |

---

## 2. In-Depth Evaluation of Major Technologies

Below is the rigorous evaluation of each foundational technology, adhering strictly to the 5 architectural audit questions.

---

### 2.1. Framework: Next.js (App Router, Standalone Node Output)

#### 1. What it does
Next.js provides a unified full-stack web application framework. It combines React Server Components (RSC), Client Components, Server Actions, file-based routing, and backend API Route Handlers within a single cohesive project structure.

#### 2. Why it is needed
An LMS has dual requirements:
- **Public catalog & marketing:** Must be Server-Side Rendered (SSR) or statically generated (SSG/ISR) for search engine indexing (SEO), social previews, and instant first-contentful paint.
- **Student player & Admin CMS:** Requires a responsive, interactive Single-Page Application (SPA) experience with client-side state management.
Next.js naturally handles both modes in a single codebase without managing two separate repositories (frontend + backend).

#### 3. Why it is suitable for this project
- **Solo Developer Advantage:** One language (TypeScript), one repository, one test suite, and shared types across client and server.
- **Windows Local Parity:** Runs natively on Windows via `npm run dev` with high-speed Turbopack compilation, or containerized via Docker Desktop with WSL2.
- **Standalone Build Mode:** When configured with `output: "standalone"`, Next.js compiles into a self-contained Node.js server that includes only the exact `node_modules` dependencies needed. It runs anywhere with `node server.js` without requiring the Vercel platform.

#### 4. What happens if we later replace it?
Because we strictly organize backend business logic into dedicated service classes (`src/server/services/*`) and repository classes (`src/server/repositories/*`), the business logic is decoupled from Next.js route handlers. If you ever migrate to a separate Fastify, Express, or NestJS backend and a pure Vite/React frontend, the service and database layer can be transferred with minimal rewriting.

#### 5. Whether it creates vendor lock-in
**NO.** By utilizing standard Node.js standalone output, standard Node environment variables, and running inside Docker or directly with PM2 on Ubuntu, the app is 100% vendor-agnostic. No Vercel proprietary features (Edge middleware with vendor APIs, Vercel Blob, Vercel KV) are permitted.

---

### 2.2. Database: PostgreSQL (Version 16+)

#### 1. What it does
PostgreSQL is the industry-standard, open-source object-relational database management system. It provides ACID compliance, strong schemas, foreign key constraints, complex indexing, full-text search, and native JSONB querying.

#### 2. Why it is needed
An educational LMS requires absolute data integrity: enrollments, course hierarchies, lesson progress, quiz attempts, scores, and certificate verifications are deeply relational. Corrupting progress records or losing relational links between lessons and courses breaks the student experience.

#### 3. Why it is suitable for this project
- Rock-solid stability with decades of production battle-testing.
- Rich support for complex queries (e.g., student course completion percentage calculation via SQL aggregation).
- Native support for JSONB, allowing flexible storage of quiz answer schemas and CMS layout configuration without schema bloat.
- Fully cross-platform: Runs inside local Docker Compose on Windows (via WSL2) and natively or containerized on all Linux distributions. Available as a managed service on AWS RDS, DigitalOcean, Hetzner, or bare metal.

#### 4. What happens if we later replace it?
PostgreSQL uses standard ANSI SQL. By abstracting queries through Prisma ORM, migrating to MySQL or MariaDB would only require adjusting the Prisma datasource provider and regenerating migrations.

#### 5. Whether it creates vendor lock-in
**NONE.** PostgreSQL is open-source (PostgreSQL License, OSI-approved). It can be self-hosted on a $4/mo VPS, run in local Docker, or spun up on any cloud provider globally.

---

### 2.3. ORM & Migration Layer: Prisma ORM

#### 1. What it does
Prisma provides a declarative modeling language (`schema.prisma`), an automated migration engine (`prisma migrate`), and an auto-generated, type-safe database query client.

#### 2. Why it is needed
Writing raw SQL strings manually for dozens of relational entities introduces typos, runtime type bugs, and painful schema migration tracking. Prisma guarantees that TypeScript types always match the exact database schema at compile time.

#### 3. Why it is suitable for this project
- **Declarative Schema:** The entire database model is documented in human-readable schema definitions, serving as the single source of truth for both developers and migrations.
- **Migration History in Git:** Every database change creates a timestamped SQL migration file committed to version control. On a fresh server or new dev machine, `npx prisma migrate deploy` reproduces the entire database deterministically.
- **Cross-Platform:** Works natively on Windows PowerShell and Linux bash without binary compilation issues.

#### 4. What happens if we later replace it?
Prisma migrations are standard plain SQL files stored in `prisma/migrations/`. If you decide to transition to Drizzle ORM or Kysely in the future, the underlying PostgreSQL database schema remains intact, and the raw SQL migration history can be adopted by any standard migration tool.

#### 5. Whether it creates vendor lock-in
**NO.** Prisma ORM is open-source (Apache 2.0). We do NOT use proprietary Prisma Data Platform or Accelerate services; we connect directly to PostgreSQL via standard direct database connection strings (`DATABASE_URL=postgresql://...`).

---

### 2.4. Authentication: Self-Hosted Session Engine (Argon2id + HTTP-Only Cookies)

#### 1. What it does
Manages user identity, registration, login, session persistence, role authorization, and credential verification without external identity SaaS providers.

#### 2. Why it is needed
To allow students, instructors, and administrators to securely access their accounts, manage course content, and protect private paid learning resources.

#### 3. Why it is suitable for this project
- **Argon2id Hashing:** Winner of the Password Hashing Competition; immune to GPU/ASIC brute-force cracking attacks.
- **HttpOnly, SameSite=Lax Cookies:** Immune to JavaScript XSS token theft (unlike storing JWTs in `localStorage`).
- **Complete Data Ownership:** All user records, password hashes, and session tables reside directly inside your PostgreSQL database.
- **No Monthly Costs or User Tiers:** Unlike third-party auth platforms (Clerk, Auth0, Okta) that charge per-user fees or gate user databases, self-hosted authentication has zero marginal cost per user.

#### 4. What happens if we later replace it?
Since password hashes follow the standard PHC Argon2id string format (`$argon2id$v=19$m=...`), users can be migrated to any standard identity provider or custom backend in the future without forcing user password resets.

#### 5. Whether it creates vendor lock-in
**ZERO.** You own the user table, authentication logic, and session store completely.

---

### 2.5. Object Storage: Universal S3 API Client (`@aws-sdk/client-s3`)

#### 1. What it does
Provides the interface to store, retrieve, and generate access URLs for unstructured binary assets: course videos, high-resolution covers, downloadable dataset files (.csv, .xlsx), PDF lecture notes, and generated certificates.

#### 2. Why it is needed
Relational databases degrade significantly when storing large binary files (BLOBs), causing severe performance bottlenecks, ballooning backup sizes, and slow query executions. Relational databases should store only file metadata (key, filename, size, MIME type); the binary files must reside in dedicated object storage.

#### 3. Why it is suitable for this project
- **Presigned Uploads:** Enables students and admins to upload large files (e.g., 1GB video or 50MB dataset) directly from their browser to object storage via signed PUT URLs. The Node.js application server never touches the heavy upload payload, consuming minimal CPU and RAM.
- **Time-Limited Signed Download URLs:** Protects paid educational materials from unauthorized hotlinking and sharing.
- **Universal S3 Standard:** Works identically with MinIO (local dev), Cloudflare R2 ($0 egress fees), and AWS S3 without changing any application code.
- **Zero Cloudflare-Specific API Lock-in:** Communicates strictly via standard S3 commands.

#### 4. What happens if we later replace it?
Because we code against `@aws-sdk/client-s3` pointing to standard S3 endpoint URLs, changing providers requires **zero code changes**. You simply update 5 environment variables:
```env
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_BUCKET="kemix-academy-protected"
S3_ACCESS_KEY_ID="xxx"
S3_SECRET_ACCESS_KEY="yyy"
```

#### 5. Whether it creates vendor lock-in
**ZERO.** The S3 API is an open de-facto standard supported by MinIO (self-hosted), Cloudflare R2, Wasabi, Backblaze B2, DigitalOcean Spaces, and AWS S3.

---

### 2.6. UI Design System & Component Architecture: Tailwind CSS + shadcn/ui + Radix Primitives

#### 1. What it does
Provides a utility-first CSS framework (Tailwind) combined with accessible, unstyled UI primitives (Radix UI) and copy-paste, owned component source code (shadcn/ui).

#### 2. Why it is needed
Building an LMS requires an extensive array of UI elements: accessible modals, tabs, dropdowns, data tables for student management, video progress bars, accordion syllabus trees, and interactive quiz interfaces.

#### 3. Why it is suitable for this project
- **Code Ownership (No NPM Package Bloat):** shadcn/ui copies accessible React component source files directly into your repository (`src/components/ui/*`). You own 100% of the UI code and can customize any style or behavior.
- **Zero Runtime Performance:** Tailwind generates pure static CSS classes at build time, eliminating CSS-in-JS runtime overhead.
- **Accessibility (A11y):** Radix primitives provide out-of-the-box keyboard navigation, screen reader ARIA attributes, and focus management (WCAG 2.1 AA compliant).

#### 4. What happens if we later replace it?
Because the components live directly in your source code, you are not bound to an external UI package's breaking updates. You can replace individual components with bespoke HTML/CSS at any time.

#### 5. Whether it creates vendor lock-in
**ZERO.** Open source (MIT License). Everything exists as local source code inside your Git repository.

---

### 2.7. Animation & Micro-Interactions: Framer Motion + Lucide React

#### 1. What it does
Framer Motion is a declarative animation library for React that powers smooth transitions, entrance animations, drag-and-drop syllabus reordering, and micro-interactions. Lucide React provides lightweight, consistent SVG iconography.

#### 2. Why it is needed
A modern educational platform requires high visual polish: smooth tab transitions between course materials, accordion animations for curriculum outlines, subtle celebration animations on quiz completion, and responsive mobile navigation drawers.

#### 3. Why it is suitable for this project
- Declarative syntax compatible with React component lifecycles.
- Excellent layout animation support (essential for the admin drag-and-drop curriculum reordering).
- Lucide React is tree-shakable (only icons used are included in the bundle).

#### 4. What happens if we later replace it?
Animations are isolated to UI presentation wrappers. If removed, standard CSS transitions or Tailwind animation utilities can replace them with zero impact on application logic.

#### 5. Whether it creates vendor lock-in
**ZERO.** Open source (MIT License).

---

### 2.8. PDF & Certificate Generation: `pdf-lib`

#### 1. What it does
`pdf-lib` is a pure JavaScript library for creating and modifying PDF documents in any JavaScript runtime (Node.js, browser, serverless).

#### 2. Why it is needed
When a student completes a course and passes all quizzes, the system must generate a professional, printable Certificate of Completion featuring student name, course title, completion date, credential ID, and a verification QR code.

#### 3. Why it is suitable for this project
- **Pure JavaScript:** Does not require headless Chrome / Puppeteer (which consumes 500MB+ RAM and frequently breaks on cross-platform deployments).
- **No Native C++ Dependencies:** Unlike `canvas` or native PDF libraries, `pdf-lib` requires no native compilation (no Windows Visual Studio Build Tools or Linux build-essential requirements).
- **Fast & Lightweight:** Generates certificates in tens of milliseconds with minimal memory footprint.

#### 4. What happens if we later replace it?
Certificate generation is encapsulated in a single service (`src/server/services/certificate.service.ts`). If you later want HTML-to-PDF rendering via an external microservice or `@react-pdf/renderer`, only this single service needs updating.

#### 5. Whether it creates vendor lock-in
**ZERO.** Pure open-source JavaScript library (MIT License).

---

### 2.9. Validation & Schema Enforcement: Zod

#### 1. What it does
Zod provides TypeScript-first schema declaration and runtime data validation.

#### 2. Why it is needed
Untrusted user inputs (registration forms, quiz answers, course uploads, query params, environment variables) must be strictly validated at runtime before touching business logic or the database.

#### 3. Why it is suitable for this project
- Validates once, infers static TypeScript types automatically (`z.infer<typeof schema>`).
- Validates `.env` variables at boot time, preventing the application from starting if a required secret is missing or misconfigured.
- Shared between client forms (React Hook Form) and server API route handlers, guaranteeing input consistency.

#### 4. What happens if we later replace it?
Validation schemas are modular. If replaced with Valibot or ArkType, schema definitions can be refactored without altering the core database or UI logic.

#### 5. Whether it creates vendor lock-in
**ZERO.** Open source (MIT License).

---

### 2.10. Background Processing & Queuing: BullMQ + Redis 7 (Modular Architecture)

#### 1. What it does
Provides distributed message queues and background job scheduling for asynchronous tasks: sending welcome/password-reset emails, generating heavy certificate PDFs, processing media webhooks, and recalculating course analytics.

#### 2. Why it is needed
User-facing HTTP requests must respond in under 200ms. Operations like sending emails via external SMTP servers or generating files should run in the background so the user is never kept waiting.

#### 3. Why it is suitable for this project
- **Redis-Backed:** Lightning-fast, robust handling of job retries, delays, and backoff strategies.
- **Graceful Fallback Design:** In minimalist local development on Windows where Redis might not be run, the application architecture provides an **in-process async adapter fallback** so development proceeds without requiring Redis to be active.

#### 4. What happens if we later replace it?
Queues are accessed through an abstract `JobQueue` interface. If replaced with a PostgreSQL-backed queue (such as PgBoss or Graphile Worker) or AWS SQS, only the queue adapter is swapped.

#### 5. Whether it creates vendor lock-in
**ZERO.** Redis and BullMQ are open-source.

---

## 3. Docker & WSL2 Local Development Architecture

### 3.1. Infrastructure Containerization Strategy
On Windows 10/11, Docker Desktop backed by WSL2 runs Linux-native containers with near-bare-metal performance:

```
┌─────────────────────────────────────────────────────────────┐
│                 WINDOWS 10/11 WORKSTATION                   │
│                                                             │
│   VS Code / Cursor (Editing Source Code on Windows Path)    │
│   Node.js 20 LTS (Running `npm run dev` with Turbopack)     │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │             DOCKER DESKTOP (WSL2 BACKEND)           │   │
│   │                                                     │   │
│   │   Container: postgres:16-alpine (Port 5432)         │   │
│   │   Container: minio/minio        (Ports 9000/9001)   │   │
│   │   Container: redis:7-alpine     (Port 6379)         │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

This hybrid workflow gives the best of both worlds:
1. **Instant HMR & IDE Performance:** Next.js and TypeScript run directly on the host using Node.js, providing instantaneous hot module replacement without container volume mount lag.
2. **Deterministic Infrastructure:** PostgreSQL, MinIO, and Redis run in isolated, reproducible Docker containers via `docker compose up -d`, ensuring identical versions across developer machines.

---

## 4. Stack Summary for Solo Developer Feasibility

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPER WORKSTATION                    │
│             (Windows 10 / 11 + Docker Desktop)              │
│                                                             │
│   IDE: VS Code / Cursor                                     │
│   Runtime: Node.js 20+ LTS + npm                            │
│   Local DB: Docker PostgreSQL (docker compose)              │
│   Local S3: Docker MinIO (docker compose)                   │
│   Source Control: Git + GitHub Repository                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ git push origin main
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB CI/CD PIPELINE                    │
│   1. Lint & Format Check (ESLint, Prettier)                 │
│   2. TypeScript Compilation Check (`tsc --noEmit`)          │
│   3. Vitest Unit & Integration Tests                        │
│   4. OCI Container Build Test                               │
└──────────────────────────────┬──────────────────────────────┘
                               │ automated deploy trigger
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCTION LINUX SERVER                   │
│             (Ubuntu 22.04 / 24.04 LTS VPS / Cloud)          │
│                                                             │
│   Reverse Proxy: Nginx / Traefik (Auto Let's Encrypt SSL)   │
│   App Container: KEMIX Academy Standalone Node Container    │
│   Database: Managed PostgreSQL OR Containerized PostgreSQL  │
│   Storage: Cloudflare R2 / AWS S3 (S3 API Compliant)        │
└─────────────────────────────────────────────────────────────┘
```
