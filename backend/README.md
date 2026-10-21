# Velocitype Backend REST API & Real-Time Server

TypeScript + Express + MongoDB (Mongoose) + Socket.io backend for **Velocitype**.

---

## 1. Environment Variables

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`.

### Backend (`backend/.env`)
| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `5000` | HTTP & WebSocket server port |
| `NODE_ENV` | No | `development` | `development` or `production` (enforces HTTPS, HSTS, and strict `JWT_SECRET` in `production`) |
| `MONGODB_URI` | Yes (Prod) | `mongodb://127.0.0.1:27017/velocitype` | MongoDB connection string (falls back to `mongodb-memory-server` in development if unreachable) |
| `USE_MEMORY_DB` | No | `false` | Force in-memory MongoDB for local testing |
| `JWT_SECRET` | Yes (Prod) | Random 256-bit ephemeral secret in dev | Secret key for signing JWT access and password-reset tokens (minimum 16 characters in production) |
| `CORS_ORIGINS` | No | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated list of allowed frontend origins for REST CORS and Socket.io |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth 2.0 Client ID for verifying Google ID tokens |
| `GEMINI_API_KEY` | No | — | Server-side Gemini API key for `POST /api/sentences/generate` (kept strictly on the backend) |
| `SMTP_HOST` | No | Ethereal test account | SMTP server hostname for sending 6-digit password reset OTPs |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_SECURE` | No | `false` | `true` for TLS on port 465 |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password / app password |

### Frontend (`frontend/.env`)
| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | `http://localhost:5000/api` | Base URL for the backend REST API |
| `VITE_GOOGLE_CLIENT_ID` | No | — | Public Google OAuth Client ID |

---

## 2. Setup & Running Instructions

### Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Development
```bash
# Terminal 1 — Start Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Start Frontend (port 5173)
cd frontend
npm run dev
```

### Production Build
```bash
cd backend && npm run build && NODE_ENV=production npm start
cd frontend && npm run build
```

---

## 3. REST API Endpoints

All endpoints return JSON and use standard HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`, `413`, `429`, `500`, `503`).
Protected endpoints require `Authorization: Bearer <jwt_token>`.

### Health & Status
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Returns API & MongoDB connection health status (`200 OK` / `503 Service Unavailable`) |

### Authentication & User Profile (`/api/auth`)
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | Public (Rate-limited) | Register a new user (`username`, `email`, `password`, optional `avatarUrl`). Role and initial ELO (`10`) are enforced server-side. Returns `{ token, user }` (`201 Created`). |
| `POST` | `/api/auth/login` | Public (Rate-limited) | Authenticate with `email` and `password`. Returns `{ token, user }` (`200 OK`). |
| `POST` | `/api/auth/google` | Public (Rate-limited) | Verify Google OAuth ID `credential` token and sign in or create account (`200 OK`). |
| `POST` | `/api/auth/forgot-password` | Public (Rate-limited) | Generate a cryptographically random 6-digit OTP and email it to the user (`200 OK`). |
| `POST` | `/api/auth/verify-otp` | Public (Rate-limited) | Verify the 6-digit OTP (max 5 attempts, 5-min expiry) and issue a single-purpose 15-min `resetToken` (`200 OK`). |
| `POST` | `/api/auth/reset-password` | Public (Rate-limited) | Reset password using a verified `resetToken` and `newPassword` (`200 OK`). |
| `GET` | `/api/auth/me` | Private (`Bearer`) | Get current user profile, preferences, and aggregated stats (`testCount`, `savedWordsCount`, `bestWpm`, `avgWpm`, `avgAccuracy`, `totalDuration`, `elo`) (`200 OK`). |
| `PUT` / `PATCH` | `/api/auth/settings` | Private (`Bearer`) | Update user visual/game preferences (`fontFamily`, `colorTheme`, `bgTheme`, `fullTheme`, `portalBorder`, `avatarUrl`, `language`, `selectedCharacters`, `layoutConfig`, `setupPrefs`). Rejects any attempt to modify `elo`, `role`, or `score` (`403 Forbidden`). |
| `PATCH` | `/api/auth/profile` | Private (`Bearer`) | Update `username` and/or `avatarUrl` (`200 OK`). |

### Typing Test Results, Statistics & Leaderboards (`/api/results`)
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/results` | Private (`Bearer`) | Save a completed typing test result. Server authoritatively computes/verifies `wpm` and `accuracy` from `typed` words / `correctChars` / `duration` and rejects impossible (`wpm > 350`) or inconsistent scores (`201 Created`). |
| `GET` | `/api/results/history` | Private (`Bearer`) | Get the authenticated user's test history (`?limit=20&page=1`) (`200 OK`). |
| `GET` | `/api/results/stats` | Private (`Bearer`) | Get detailed statistics (`testCount`, `bestWpm`, `avgWpm`, `avgAccuracy`, `totalDuration`, `totalWordsTyped`, `elo`, `recentResults`) (`200 OK`). |
| `GET` | `/api/results/leaderboard` | Public (Rate-limited) | Get global top WPM leaderboard (`?type=wpm&limit=10`, deduplicated per user) or Ranked ELO leaderboard (`?type=elo&limit=10`) (`200 OK`). |
| `DELETE` | `/api/results/:id` | Private (`Bearer`) | Delete a specific test result owned by the authenticated user (enforces ownership check to prevent IDOR) (`200 OK`). |

### Saved Words Library (`/api/words`)
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/words/saved` | Private (`Bearer`) | List the authenticated user's bookmarked words (`?q=` optional search filter) (`200 OK`). |
| `POST` | `/api/words/saved` | Private (`Bearer`) | Save or update a bookmarked word and its meaning (`201 Created` / `200 OK`). |
| `PUT` | `/api/words/saved/:id` | Private (`Bearer`) | Update the meaning of a saved word owned by the authenticated user (`200 OK`). |
| `DELETE` | `/api/words/saved/:id` | Private (`Bearer`) | Delete a saved word owned by the authenticated user (`200 OK`). |

### AI Sentence Generation Proxy (`/api/sentences`)
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/sentences/generate` | Public (Rate-limited) | Generates themed typing sentences via backend `GEMINI_API_KEY` so no API key is exposed in frontend code (`200 OK` / `503` fallback). |

---

## 4. Security Architecture

1. **Authentication & Token Purpose Separation**:
   - Passwords hashed with `bcrypt` (10 salt rounds) and excluded from JSON serialization.
   - Single-purpose password-reset tokens (`purpose: 'password-reset'`) are rejected by the `protect` bearer middleware.
   - Socket.io connections require a valid JWT in `socket.handshake.auth.token` and resolve `userId`, `username`, and `elo` directly from MongoDB.
2. **Authorization & Anti-Tampering**:
   - Every user resource query (`SavedWord`, `TestResult`) scopes lookups by `{ _id: id, user: req.user._id }` to prevent Broken Access Control / IDOR.
   - Client attempts to submit or modify `elo`, `role`, or `score` via signup/settings/profile endpoints are blocked (`403 Forbidden` or ignored).
   - Typing test submissions (`POST /api/results`) recompute WPM/accuracy from `typed` words or `correctChars` and reject manipulated or superhuman values (`wpm > 350`, mismatched `correctCount / totalWords`, or implausible character counts).
3. **NoSQL Injection & XSS Prevention**:
   - `sanitizeRequest` recursively strips keys starting with `$`, containing `.`, or matching `__proto__` / `constructor` / `prototype` from `req.body`, `req.query`, and `req.params`.
   - `avatarUrl` is validated against an allowlist of `https://` URLs and `data:image/(png|jpeg|jpg|webp|gif);base64,...` (blocking `javascript:` and `data:text/html` XSS payloads).
4. **Rate Limiting, CORS, HTTPS & Security Headers**:
   - Per-IP rate limiting with `X-RateLimit-*` and `Retry-After` headers across auth, password recovery, results, words, and sentence endpoints.
   - `helmet` CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS, and production HTTPS enforcement.
