# Production Deployment Readiness Checklist

**Application**: AVERO Media Flow  
**Version**: 1.0.0  
**Audit Date**: 2026-08-19  

---

## 1. Environment & Secrets Management

- [ ] **Generate Production `API_SECRET_TOKEN`**:
  ```bash
  openssl rand -hex 32
  ```
  Set this in your production `.env` / container secret manager.
- [ ] **Configure `ENVIRONMENT=production`**:
  Enables strict mode (blocks default secrets and enables strict proxy parsing).
- [ ] **Set `CORS_ORIGINS`**:
  Set to your live frontend domains, e.g. `["https://avero.app"]`.
- [ ] **Set `NEXT_PUBLIC_SITE_URL` & `NEXT_PUBLIC_API_URL`**:
  Points Next.js to your public HTTPS domain and FastAPI backend instance.

---

## 2. Infrastructure & Hosting Recommendations

- **Reverse Proxy (Nginx / Cloudflare)**:
  - Place Nginx or Cloudflare in front of the application for SSL/TLS termination, DDoS mitigation, and gzip/brotli compression.
  - Forward `X-Forwarded-For` and `X-Real-IP` headers to the FastAPI server, ensuring client IP rate limiting functions properly.
- **Background Worker & Storage**:
  - Temporary files are stored in `/tmp/mediaflow_downloads` (or custom `MEDIA_STORAGE_PATH`).
  - Automatic cleanup runs every 10 minutes, purging files older than 60 minutes.

---

## 3. AdSense & Monetization Safety Guidelines

- **Ad Placement Integrity**:
  - Keep ad units distinct from interactive download or action controls.
  - Maintain the labeled container system implemented in `AdSlot`.
  - Avoid intrusive interstitials or deceptive CTA styles.

---

## 4. Platform Policy & Compliance

- **Non-Hosting Model**: AVERO functions as a temporary processing proxy; no copyrighted video files are stored permanently.
- **Statutory DMCA Enforcement**: DMCA notice and procedure pages are accessible at `/dmca` with 6 statutory requirements specified.
- **Zero Log Privacy**: No user download history or tracking cookies are maintained on the server.
