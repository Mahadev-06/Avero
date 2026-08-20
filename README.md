# MediaFlow — Production-Ready Media Utility Platform

MediaFlow is a high-performance, compliant, and security-hardened web application designed to analyze, organize, and process authorized media URLs from supported public platforms and direct media links.

Inspired by the artisan aesthetic and bold typography of Studio Job, MediaFlow combines modern SaaS design (Next.js 15, React 19, Vanilla CSS design system) with a decoupled, asynchronous micro-architecture (FastAPI, Redis, ARQ worker, SSE updates).

---

## 🎨 Studio Job Design System

MediaFlow adopts the luxury, tactile design language specified in Studio Job design specifications:

- **Typography**: Clean, high-impact sans typography (`Inter` variable font, inspired by Graphik) with custom scale (`xs` to `4xl`).
- **Primary Palette**: Warm artisan brown (`#bf7540`, `--color-primary-500`) with full shade scale (`50` to `950`).
- **Secondary Palette**: Crimson accent (`#e62229`, `--color-secondary-500`) for high-priority intents.
- **Accent Palette**: Rich Studio Job gold (`#fec600`, `--color-accent-500`) for highlights and active states.
- **Neutral Palette**: Crisp high-contrast grayscale (`#000000` to `#f7f7f7`) with full dark mode support via `data-theme`.
- **Borders & Shadows**: Crisp 5px solid offsets (`--shadow-sm`) and elevation shadows.

---

## 🏛️ Compliance & Legal Architecture

MediaFlow operates with strict policy compliance across all public platforms:

| Platform | Download Supported? | Integration Mechanism | Legal / Compliance Note |
| :--- | :---: | :--- | :--- |
| **Direct URL** | ✅ Yes | HTTP Stream / FFmpeg | Direct public files (MP4, WebM, MP3, WAV, images) |
| **YouTube** | ❌ No | YouTube Data API v3 | Search & metadata preview only; download disabled per Terms of Service |
| **Instagram** | ❌ No | Meta oEmbed API | Rich oEmbed card preview & direct link-out |
| **TikTok** | ❌ No | TikTok oEmbed API | Rich oEmbed card preview & direct link-out |
| **Facebook** | ❌ No | Meta oEmbed API | Rich oEmbed card preview & direct link-out |
| **X (Twitter)** | ❌ No | Twitter oEmbed API | Rich oEmbed card preview & direct link-out |

---

## 🛡️ Security Architecture

1. **SSRF Defense (`app/core/security/ssrf.py`)**:
   - Custom HTTP client resolves DNS before connecting.
   - Rejects all private IPv4/v6 ranges (`10.0.0.0/8`, `127.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`, `::1`, `fe80::`, etc.).
   - IPv4-mapped IPv6 detection (`::ffff:127.0.0.1`).
   - Pinning resolved IP to prevent DNS rebinding attacks.
   - Validates each hop during HTTP redirects (max 3).

2. **File Security (`app/core/security/file_security.py`)**:
   - Unicode NFKC filename sanitization.
   - UUID-based internal file storage paths.
   - ZIP-slip prevention and path traversal validation.
   - Maximum total archive size and file count enforcement.

3. **API & Web Security**:
   - Next.js CSP headers with nonce support (`middleware.ts`).
   - Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`, `Permissions-Policy`.
   - Rate limiting powered by `SlowAPI` and Redis.
   - Request ID tracking (`X-Request-ID`) across frontend, API, and worker logs.

---

## 🏗️ Project Structure

```
mediaflow/
├── docker-compose.yml          # Local dev orchestrator (Redis, API, Worker, Web)
├── .env.example                # Documented configuration template
├── README.md                   # Platform documentation
├── backend/                    # Python 3.12 FastAPI Service
│   ├── app/
│   │   ├── api/v1/endpoints/   # Health, Analyze, Jobs, Download, Search, Admin
│   │   ├── core/               # Config, Redis pool, Exceptions, Security (SSRF, Files, Rate Limits)
│   │   ├── middleware/         # Security headers, Request ID, Body size limiter
│   │   ├── platforms/          # Adapter registry & Platform implementations
│   │   ├── schemas/            # Pydantic v2 schemas for jobs, search, analyze
│   │   ├── services/           # JobService, DownloadService, ZipService, CleanupService
│   │   └── worker/             # ARQ Async task worker definitions
│   ├── Dockerfile              # Multi-stage production build (non-root appuser)
│   ├── Dockerfile.dev          # Hot-reload development build with FFmpeg
│   └── requirements.txt
└── frontend/                   # Next.js 15 App Router Frontend
    ├── src/
    │   ├── app/                # App Router pages (Home, Queue, Search, Legal pages)
    │   ├── components/         # Studio Job styled components (Layout, Media, Search, Legal)
    │   ├── hooks/              # SSE hooks, Queue wrappers, Media query hooks
    │   ├── lib/                # API client, URL parser, formatters
    │   └── stores/             # Zustand state store for job queue
    └── Dockerfile.dev
```

---

## 🚀 Quick Start (Local Development)

### 1. Environment Setup
```bash
cp .env.example .env
```

### 2. Run with Docker Compose
```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **FastAPI Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/health

### 3. Manual Local Development

#### Backend:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### ARQ Worker:
```bash
cd backend
arq app.worker.worker_main.WorkerSettings
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 📜 License & Compliance

MediaFlow is provided as a draft template for educational and open utility purposes. Commercial deployment requires reviewing all applicable terms of service of third-party APIs and consulting legal counsel.
