# LibraLink — Full Launch Guide

This is a step-by-step guide to getting **both halves of LibraLink running from
scratch**: the Spring Boot backend and the Expo/React Native frontend, in local
development, and in production.

```
LibraLink/
├── Backend/                 # Spring Boot 4 / Java 21 REST API
└── Frontend/LibraLink/      # Expo / React Native (TypeScript) app
```

Architecture in one line: **Expo app → JWT-secured REST API → PostgreSQL**, with
optional integrations for email, push notifications, Paystack payments, and
Google Gemini (AI chat / text-to-speech).

---

## 0. Prerequisites

| Tool | Version | Check | Notes |
|------|---------|-------|-------|
| Java (JDK) | 21 | `java -version` | Backend language runtime |
| PostgreSQL | 14+ | `psql --version` | Must be running before you start the backend |
| Node.js | 18+ | `node -v` | For the Expo app |
| npm | bundled with Node | `npm -v` | |
| Xcode + iOS Simulator | latest | — | macOS only, to run the app on iOS |
| Android Studio + emulator | latest | — | optional, to run on Android |
| Expo Go app | latest | — | optional, to run on a **physical** phone without a dev build |
| Git | any | `git --version` | |

The backend uses the Maven wrapper (`./mvnw`) — no separate Maven install is
needed.

---

## PART A — Backend (local)

### A.1 Create the database

```bash
createdb libralink
```

If your local Postgres uses trust auth, no password is needed. Otherwise create
a role and note its username/password.

### A.2 Configure environment variables

```bash
cd Backend
cp .env.example .env
```

Edit `Backend/.env`. The app reads this file automatically at startup
(`spring.config.import=optional:file:./.env[.properties]` in
`application.properties`) — you do **not** need to `source` it manually.

**Required — the app refuses to start without these:**

| Variable | What it is |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/libralink` |
| `SPRING_DATASOURCE_USERNAME` | your Postgres user |
| `SPRING_DATASOURCE_PASSWORD` | your Postgres password (blank ok for local trust auth) |
| `JWT_SECRET` | long random string — used to sign auth tokens. Generate one with `openssl rand -base64 48` |

**Recommended for local/demo:**

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `8080` | must match the frontend's `API_BASE_URL` (see B.2) |
| `SEED_ADMIN_EMAIL` | `admin@libralink.com` | admin account created on first boot |
| `SEED_ADMIN_PASSWORD` | `admin123` | **change this outside local dev** |
| `SEED_ADMIN_FIRST_NAME` / `SEED_ADMIN_LAST_NAME` | `Admin` / `User` | |
| `PICKUP_WINDOW_MINUTES` | `30` | length of a pickup slot (Mon–Fri 09:00–17:00 only) |

**Optional integrations (leave blank to disable the feature — nothing else
breaks):**

| Feature | Variables | Behavior when unset |
|---|---|---|
| Email (password reset) | `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`, `SPRING_MAIL_FROM` | Reset codes are printed to the server console instead of emailed |
| Expo push notifications | `EXPO_PUSH_ENABLED=true` | Pushes are not sent (in-app notifications still work) |
| Paystack fine payments | `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_BASE_URL`, `PAYSTACK_CURRENCY` | `/api/fine-payments/initialize` and `/verify` return `503` |
| Ask Libra AI chat / exam tools / audiobook narration | `AI_API_KEY`, `AI_API_URL`, `AI_MODEL`, `TTS_MODEL`, `TTS_VOICE` | Ask Libra falls back to canned answers; exam generation and TTS narration are disabled |

See Part D and Part E below for how to actually obtain and wire up the
Paystack, email, and AI keys.

### A.3 Run the backend

```bash
cd Backend
./mvnw spring-boot:run
```

The API starts at **http://localhost:8080**. On first run against an empty
database, `DataSeeder` will:

- create the schema (`spring.jpa.hibernate.ddl-auto=update`)
- seed an **Admin** account (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`)
- seed a demo **Student** account: `student@libralink.com` / `student123`
- seed a KNUST-style institution, a ~22-book catalogue, demo loans, courses /
  reading lists, and a demo audiobook track

> No **Librarian** account is seeded — create one after logging in as Admin
> (assign the Librarian role to a user), or via
> `POST /api/auth/register-librarian` with an Admin/Librarian bearer token.

Sanity check the API is up:

```bash
curl http://localhost:8080/api/books
```

### A.4 Run backend tests (optional)

```bash
./mvnw test
```

Tests run against an in-memory H2 database — no `.env` / Postgres required.

---

## PART B — Frontend (local)

### B.1 Install dependencies

```bash
cd Frontend/LibraLink
npm install
```

### B.2 Point the app at your backend

Edit `Frontend/LibraLink/src/config/api.ts`:

```ts
const API_BASE_URL = "http://localhost:8080";
```

Which value to use depends on how you're running the app:

| Target | `API_BASE_URL` value |
|---|---|
| iOS Simulator | `http://localhost:8080` (simulator shares the Mac's network) |
| Android Emulator | `http://10.0.2.2:8080` (Android's alias for the host machine's `localhost`) |
| Physical device via Expo Go (same Wi-Fi as your Mac) | `http://<your-Mac-LAN-IP>:8080` — find it with `ipconfig getifaddr en0` |
| Pointing at the deployed backend | `https://libralink-rgp2.onrender.com` (or your own Render URL) |

> The current file has a comment noting it's temporarily pinned to a specific
> LAN IP for physical-device testing. **Recheck and update this value** if
> you're on different Wi-Fi than when it was last set, and remember to revert
> to the production URL before making a release build (see B.5).

### B.3 Run the app

```bash
npm start          # then press i (iOS), a (Android), w (web), or scan the QR with Expo Go
# or directly:
npm run ios
npm run android
npm run web
```

### B.4 Log in

| Role | Email | Password |
|---|---|---|
| Admin | `admin@libralink.com` | your `SEED_ADMIN_PASSWORD` (default `admin123`) |
| Student | `student@libralink.com` | `student123` |

On the login screen, **select the matching role chip** (Student / Librarian /
Admin) before entering credentials — the backend validates the account
actually holds that role.

### B.5 Building for production / app stores

There is no `eas.json` in this repo yet, so a couple of one-time steps are
needed before you can produce an installable build:

1. **Set `API_BASE_URL` to the production backend** in `src/config/api.ts`
   (never ship a build pointing at `localhost` or a LAN IP).
2. Install the EAS CLI and log into an Expo account:
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. Initialize EAS for this project (creates `eas.json` and registers an EAS
   `projectId`, which is also required for Expo push notifications to work in
   a production build — see `src/services/push.ts`):
   ```bash
   cd Frontend/LibraLink
   eas init
   ```
4. Build:
   ```bash
   eas build --platform ios
   eas build --platform android
   ```
5. Submit to the stores when ready:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

For Android, the app's camera permission (QR pickup scanning) and deep-link
scheme (`libralink://`, used by the Paystack payment flow — see Part D) are
already declared in `app.json`; no extra native config is required for a
standard EAS build.

---

## PART C — Backend production deploy (Render)

The project currently deploys to Render at `https://libralink-rgp2.onrender.com`
via `Backend/Dockerfile`. To stand up your own instance:

1. **Provision a managed PostgreSQL database** (Render Postgres, or any
   provider) and note its connection URL/user/password.
2. **Create a new Render Web Service** pointing at this repo, with:
   - Root directory: `Backend`
   - Environment: **Docker** (Render will build `Backend/Dockerfile` directly —
     it's a two-stage build producing a JRE image that runs `java -jar
     app.jar` on port `8080`, matching `EXPOSE 8080` in the Dockerfile)
3. **Set environment variables** on the Render service (Settings →
   Environment) — same required/optional set as Part A.2:
   - `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`,
     `SPRING_DATASOURCE_PASSWORD` (from your managed Postgres)
   - `JWT_SECRET` — a fresh, strong secret (do **not** reuse the local dev one)
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — **use a strong password in
     production**; note that `seed.demo.enabled` defaults to `true`, which
     also creates the weak demo student account. Set `SEED_DEMO_ENABLED=false`
     in production to skip the demo student and force a strong
     `SEED_ADMIN_PASSWORD` (startup fails fast if that's missing).
   - Any of the optional integration vars from Part A.2 / D / E you want live
     (Paystack **live** keys, real SMTP, `AI_API_KEY`, `EXPO_PUSH_ENABLED=true`)
   - `Backend/.env` is git-ignored and never gets into the Docker image (the
     `Dockerfile` only copies `mvnw`, `.mvn`, `pom.xml`, and `src`) — Render's
     real environment variables are the only way secrets reach the deployed
     container, and they take precedence over any `.env` if one were present.
4. Deploy. Render builds the Docker image and starts the container; watch the
   logs for `DataSeeder` output confirming the schema was created and the
   admin account seeded.
5. Update `Frontend/LibraLink/src/config/api.ts` (`API_BASE_URL`) to point at
   the new Render URL before building the frontend for release.

---

## PART D — Paystack payments (fine payments)

Fine payments use a real Paystack checkout (`/api/fine-payments/initialize`
+ `/verify`); nothing is marked paid until Paystack confirms the charge
server-side.

### D.1 Get test keys (dev/demo)

1. Create a Paystack account → Dashboard → **Settings → API Keys & Webhooks**,
   in **Test Mode**.
2. Copy the keys into `Backend/.env`:
   ```
   PAYSTACK_SECRET_KEY=sk_test_...
   PAYSTACK_PUBLIC_KEY=pk_test_...
   PAYSTACK_BASE_URL=https://api.paystack.co
   PAYSTACK_CURRENCY=GHS
   ```
3. Restart the backend. Amounts are charged in GHS, converted to pesewas
   server-side.
4. Test card: `4084 0840 8408 4081`, any future expiry, any CVV.

If `PAYSTACK_SECRET_KEY` is blank, the payment endpoints return `503` and the
fine simply stays unpaid in the app (no crash).

### D.2 How the mobile checkout flow works

`src/app/pay-fines.tsx`:

1. The app calls `POST /api/fine-payments/initialize` with the fine id and a
   deep-link `callbackUrl` built via `Linking.createURL("paystack-callback")`
   (resolves to `libralink://paystack-callback` — the `libralink` scheme is
   registered in `app.json`).
2. It opens the returned Paystack `authorizationUrl` with
   `WebBrowser.openAuthSessionAsync`, which hands control back to the app once
   Paystack redirects to the callback URL.
3. The app then calls `POST /api/fine-payments/verify` with the transaction
   reference; only on a confirmed Paystack success does the backend record the
   payment and mark the fine paid. Re-verifying an already-settled reference
   is a no-op (idempotent).

**Android note:** this deep-link redirect is the piece that was recently
hardened (see the "Fix Android Paystack payment" commit) — if you test
payments on Android, confirm the `libralink://paystack-callback` redirect
actually returns control to the app (not just iOS) after a successful
checkout in the Paystack web view.

### D.3 Going live

Repeat D.1 with **live** keys (`sk_live_...` / `pk_live_...`) from Paystack's
Live Mode, and set them as Render environment variables (Part C.3). Confirm
your Paystack account is fully activated for live charges before switching.

---

## PART E — Other optional integrations

### E.1 Email (password reset)

If `SPRING_MAIL_HOST` is blank, reset codes are logged to the server console
— fine for local dev. To send real email via Gmail:

1. Enable 2-Step Verification on the Google account.
2. Google Account → Security → **App passwords** → generate a 16-character
   password.
3. Set in `.env`:
   ```
   SPRING_MAIL_HOST=smtp.gmail.com
   SPRING_MAIL_PORT=587
   SPRING_MAIL_USERNAME=your-address@gmail.com
   SPRING_MAIL_PASSWORD=your16charapppassword
   SPRING_MAIL_FROM=your-address@gmail.com
   ```
   `SPRING_MAIL_PASSWORD` must be the App Password (not your normal Google
   password), and `SPRING_MAIL_FROM` must equal `SPRING_MAIL_USERNAME` (Gmail
   rewrites the From header to the authenticated account).

### E.2 AI ("Ask Libra" chat, exam tools) + text-to-speech narration

Both share one Google AI Studio (Gemini) key:

1. Get a key at https://aistudio.google.com/apikey.
2. Set in `.env`:
   ```
   AI_API_URL=https://generativelanguage.googleapis.com/v1beta
   AI_API_KEY=your-key
   AI_MODEL=gemini-flash-latest
   TTS_MODEL=gemini-2.5-flash-preview-tts
   TTS_VOICE=Kore
   ```
3. Without `AI_API_KEY`, Ask Libra still works using canned/keyword answers,
   and exam summary/question generation and audiobook narration generation
   are disabled.

### E.3 Expo push notifications

1. Set `EXPO_PUSH_ENABLED=true` in `Backend/.env`.
2. Requires a **physical device** with the app logged in (registers a push
   token after login) — Apple push does **not** work on the iOS Simulator.
3. For a production build, the frontend also needs an EAS `projectId` (see
   B.5) for `src/services/push.ts` to obtain a push token at all.

---

## PART F — Everyday run checklist

Once everything above is configured once, day-to-day startup is just:

**Terminal 1 — backend:**
```bash
cd Backend
./mvnw spring-boot:run
```

**Terminal 2 — frontend:**
```bash
cd Frontend/LibraLink
npm start
# press i / a / w, or scan the QR with Expo Go
```

Make sure `Frontend/LibraLink/src/config/api.ts` still points at wherever the
backend is actually running (see B.2 — this is the #1 cause of "app can't
load anything").

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| App can't reach the backend / network errors on every screen | `API_BASE_URL` in `api.ts` doesn't match where the backend is listening, or Postgres isn't running. Check `PORT` in `Backend/.env` matches. |
| `relation "..." does not exist` / other DB errors on startup | The `libralink` database doesn't exist, or datasource credentials are wrong. Re-run `createdb libralink` and check `SPRING_DATASOURCE_*`. |
| Backend fails fast on startup with a message about `SEED_ADMIN_PASSWORD` | You set `SEED_DEMO_ENABLED=false` without also setting a strong, explicit `SEED_ADMIN_PASSWORD`. This is a deliberate production safety check. |
| Login says "This account can't sign in as a …" | Wrong role chip selected on the login screen for that account. |
| No password-reset email arrives | SMTP isn't configured (`SPRING_MAIL_HOST` blank) — check the backend console, the reset code is logged there instead. |
| Paying a fine returns "Online payments are not available right now" (`503`) | `PAYSTACK_SECRET_KEY` is blank or invalid in `Backend/.env`. |
| Paystack checkout succeeds but the app doesn't detect it (Android) | Verify the `libralink://paystack-callback` deep link is actually configured and firing — this is the specific Android payment flow that was recently patched. |
| Physical device can't reach the backend but the simulator can | You're using `localhost` instead of your Mac's LAN IP; re-check `ipconfig getifaddr en0` (it changes when you reconnect to Wi-Fi) and update `api.ts`. |
| Push notifications never arrive | `EXPO_PUSH_ENABLED` is `false`, you're testing on a simulator, or (for release builds) EAS isn't initialized so there's no `projectId` for the push token. |

---

## Reference: seeded accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@libralink.com` | `SEED_ADMIN_PASSWORD` (default `admin123`) |
| Student | `student@libralink.com` | `student123` |
| Librarian | *(none seeded — create via Admin UI or `/api/auth/register-librarian`)* | — |

## Reference: what's fully working out of the box vs. needs a key

| Feature | Needs configuration? |
|---|---|
| Auth, catalogue, borrowing, reservations, circulation, fines, bookmarks, in-app notifications | No — just Postgres + `JWT_SECRET` |
| Fine payments (Paystack) | Yes — `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` (Part D) |
| Password-reset email | Optional — falls back to console-logged codes without SMTP (Part E.1) |
| Push notifications | Optional — `EXPO_PUSH_ENABLED=true` + physical device (Part E.3) |
| Ask Libra chatbot | Works with canned answers with no key; real Gemini answers need `AI_API_KEY` (Part E.2) |
| Exam summaries/questions, audiobook narration (TTS) | Yes — `AI_API_KEY` (Part E.2) |
