# LibraLink — Local Launch Guide

How to run all three pieces of LibraLink locally: the Spring Boot **Backend**,
the React **Web** portal, and the Expo **mobile** app (`Frontend/LibraLink`).

Branch: `web-app`. Repo root: `/Users/mac/Desktop/LibraLink`.

---

## 0. One-time prerequisites

Already confirmed present on this machine:

- Java 21 (`java -version` → OpenJDK 21.0.11)
- Node 26 / npm 11
- PostgreSQL 16, installed via Homebrew as a service
  (`brew services list` shows `postgresql@16` started)
- `Backend/.env` — git-ignored, already present, has the local DB credentials
  and JWT secret
- `Web/.env.local` — git-ignored, already present:
  `VITE_API_BASE_URL=http://localhost:8080`

You shouldn't need to redo any of this. If `Backend/.env` or `Web/.env.local`
are ever missing, ask before recreating them — they may hold real secrets
(Paystack keys, mail credentials, etc. per the phased plan).

---

## 1. Start Postgres (if not already running)

```bash
brew services start postgresql@16
```

Check it's up:

```bash
pg_isready -h localhost -p 5432
```

Should print `localhost:5432 - accepting connections`. It's registered as a
LaunchAgent, so normally it's already running in the background — this step
is only needed after a reboot or if you stopped it manually.

---

## 2. Launch the Backend (Spring Boot, port 8080)

```bash
cd Backend
./run.sh
```

`run.sh` sources `.env` and then runs `./mvnw spring-boot:run` — Spring Boot
itself has no dotenv support, so this script is what makes the `.env`
auto-load instead of you having to `source` it by hand every time. (It only
covers the `./mvnw` / terminal path — if you ever run the app from IntelliJ's
Run button instead, that bypasses the script and you'd need to set the env
vars in the Run Configuration instead.)

**First-time-per-session startup takes ~15s** (Flyway migration + Hibernate +
DataSeeder). Confirm it's ready when you see:

```
Started LibraLinkApplication in ... seconds
```

Spring Boot DevTools is enabled — editing a backend source file triggers an
automatic restart (~5s) without needing to stop/restart the command manually.

**Sanity check once it's up:**

```bash
curl -s http://localhost:8080/api/schools -o /dev/null -w '%{http_code}\n'
```

`401` is correct here (no auth token) — it confirms the server is answering.

---

## 3. Launch the Web portal (Vite, port 5173)

In a separate terminal:

```bash
cd Web
npm run dev
```

Open **http://localhost:5173/login**. Sign in with any of the seeded staff
accounts (see §5 below) — routing sends Platform/School Admin/Librarian
accounts to `/platform`, `/school`, `/librarian` respectively.

Vite has hot module reload — editing `Web/src` files updates the browser
without a manual refresh in most cases.

---

## 4. Launch the mobile app (Expo)

```bash
cd Frontend/LibraLink
npx expo start
```

This opens the Expo dev tools in your terminal (press `i` for iOS Simulator,
`a` for Android emulator, or scan the QR code with Expo Go on a physical
device).

### Pointing the app at your local backend instead of production

**This changed** — the app no longer reads an env var for this. It's a plain
hardcoded constant in
[`src/config/api.ts`](Frontend/LibraLink/src/config/api.ts):

```ts
const API_BASE_URL = "http://localhost:8080";
```

That's already set for local dev against the iOS Simulator (which shares
your Mac's network, so `localhost` works directly). To point at something
else, edit that line directly:

- **Android emulator** — `http://10.0.2.2:8080` (Android's alias for the
  host machine's localhost).
- **Physical device via Expo Go** — your Mac's LAN IP, e.g.
  `http://192.168.x.x:8080` (find it with `ipconfig getifaddr en0`). The
  phone must be on the same Wi-Fi network, and nothing (like a firewall)
  should be blocking inbound connections to port 8080.
- **Deployed production backend** — `https://libralink-rgp2.onrender.com`
  (revert to this before shipping/deploying).

There's a leftover `Frontend/LibraLink/.env.local` file from an earlier,
env-var-based version of this — it has **no effect now** (`api.ts` doesn't
read `process.env` at all), so don't bother editing it; edit `api.ts`
instead. Restart `npx expo start` after changing it either way, since Metro
doesn't hot-reload a change to a module-level constant reliably.

---

## 5. Seeded test accounts

Left over from Phase 5/6 verification, in the local `libralink` Postgres DB:

| Role | Email | Password | School |
|---|---|---|---|
| Platform Super Admin | `platform@libralink.test` | `platform123` | — (platform-wide) |
| School Admin | `ama.owusu@ata.test` | `pass1234` | Accra Test Academy (#3) |
| School Admin (co-admin) | `co.admin@ata.test` | `pass1234` | Accra Test Academy (#3) |
| Librarian | `kofi.mensah@ata.test` | `pass1234` | Accra Test Academy (#3) |
| Legacy ADMIN | `admin@libralink.com` | (seeded, see `DataSeeder.java`) | Default School (Legacy Data) — has 17 books |

The accounts above are still the reliable ones to log in with. Quite a few
more test schools and one-off accounts have accumulated in the local DB
since from ad-hoc testing (KNUST Main Campus, Smoke Test School, a couple of
Curl Test Schools, etc.) — none of that is curated, so don't rely on it
being there; the table above is the stable baseline.

---

## 6. Quick reference — all three at once

Three terminal tabs:

```bash
# Terminal 1 — Backend
cd Backend && ./run.sh

# Terminal 2 — Web portal
cd Web && npm run dev

# Terminal 3 — Mobile (optional, remember the API_BASE_URL gotcha above)
cd Frontend/LibraLink && npx expo start
```

Backend must be up before Web or Mobile will work against local data.

---

## 7. Troubleshooting

- **Flyway silently doesn't run / `V1` gets skipped** — two
  Spring-Boot-4.x-specific bugs were fixed early on (missing
  `spring-boot-flyway` dependency; `baseline-version` default of `1`
  treating `V1` as already applied). Both fixes are already in `pom.xml` /
  `application.properties` — this is just a pointer if it ever regresses
  (the doc that originally wrote this up, `HANDOVER.md`, has since been
  removed as stale, so there's no longer a separate write-up to link to).
- **`./mvnw dependency:tree | grep -i flyway`** — sanity check if Flyway
  ever seems to silently not run.
- **CORS "Failed to fetch" on PATCH requests from the Web portal** — fixed
  in `SecurityConfig.corsConfigurationSource()` (was missing `PATCH` from
  `allowedMethods`, breaking `PATCH /api/schools/{id}`). If you see this
  again for a different method, check that list first.
- **Port 8080 already in use** — `lsof -i :8080 -sTCP:LISTEN -t` to find the
  PID. Check *what* it is before killing it — it's not always a leftover
  LibraLink process; a completely unrelated project's dev server squatting
  the port has happened before on this machine.
- **`./run.sh: Permission denied`** — its execute bit occasionally gets
  stripped (seen after switching git branches). Fix with
  `chmod +x Backend/run.sh`.

---

## 8. Optional integrations (Paystack, email, AI/TTS)

These are disabled by default (nothing breaks without them). Config lives in
`Backend/.env`.

### Paystack fine payments

Fine payments use a real Paystack checkout (`/api/fine-payments/initialize` +
`/verify`); nothing is marked paid until Paystack confirms the charge
server-side.

1. Create a Paystack account → Dashboard → **Settings → API Keys & Webhooks**,
   in **Test Mode**.
2. Set in `Backend/.env`:
   ```
   PAYSTACK_SECRET_KEY=sk_test_...
   PAYSTACK_PUBLIC_KEY=pk_test_...
   PAYSTACK_BASE_URL=https://api.paystack.co
   PAYSTACK_CURRENCY=GHS
   ```
3. Restart the backend. Amounts are charged in GHS, converted to pesewas
   server-side. Test card: `4084 0840 8408 4081`, any future expiry, any CVV.
4. If `PAYSTACK_SECRET_KEY` is blank, the payment endpoints return `503` and
   the fine simply stays unpaid (no crash).
5. Mobile checkout flow (`Frontend/LibraLink/src/app/pay-fines.tsx`): the app
   calls `initialize`, opens the returned Paystack `authorizationUrl` via
   `WebBrowser.openAuthSessionAsync` with a deep-link callback
   (`libralink://paystack-callback`, registered in `app.json`), then calls
   `verify` with the transaction reference. Re-verifying an already-settled
   reference is a no-op.
6. Going live: repeat with **live** keys (`sk_live_...` / `pk_live_...`) from
   Paystack's Live Mode, set as Render environment variables.

### Email (password reset + student email verification)

**This changed** — email no longer goes through SMTP/Gmail at all (that
dependency was removed). Both password-reset codes and the code students
get during self-registration (see below) now go through **Brevo**'s
transactional email API (a plain HTTPS call). If `BREVO_API_KEY` is blank,
codes are just logged to the server console instead — fine for local dev.

To send real email:

1. Sign up at [brevo.com](https://www.brevo.com) (free tier: 300 emails/day,
   no card required).
2. **Verify a sender email** — Brevo won't send *from* an address it hasn't
   verified. Go to **Senders, Domains & Dedicated IPs → Senders → Add a
   sender** and verify one you control.
3. **Generate an API key** — **Settings → SMTP & API → API Keys tab →
   Generate a new API key**.
4. Set in `Backend/.env`:
   ```
   BREVO_API_KEY=xkeysib-...
   BREVO_SENDER_EMAIL=the-address-you-verified@example.com
   BREVO_SENDER_NAME=LibraLink
   EMAIL_VERIFICATION_EXPIRY_MINUTES=15
   ```

### Student self-registration now requires email verification

`POST /api/auth/register` no longer logs the student in immediately — it
creates the account unverified, emails a 6-digit code (via Brevo, above),
and returns `{email, message}` with **no token**. The account can't log in
until `POST /api/auth/verify-email` confirms that code (mobile: the new
`verify-email` screen after signup). `resend-verification` is there for a
lost/expired code. This doesn't affect librarian/school-admin signup flows
— those are unchanged.

### School email domain restriction (optional, per school)

A Platform Super Admin can optionally set an email domain on a school (Web
portal → Schools → **Edit domain**, e.g. `knust.edu.gh`) to require students
registering for that school to use a matching email. **Every school has no
domain set by default**, so registration stays open to any email until an
admin opts a school in — don't be surprised if a test registration suddenly
starts failing with "Please register with your ... email address" if a
domain was set on the school you picked.

### AI ("Ask Libra" chat, exam tools) + text-to-speech narration

Both share one Google AI Studio (Gemini) key:

1. Get a key at https://aistudio.google.com/apikey.
2. Set in `Backend/.env`:
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
4. TTS generation gets its own longer HTTP read timeout (`TTS_READ_TIMEOUT_MS`,
   default `90000` = 90s) separate from other outbound calls — a book with
   more than a trivial amount of content can take Gemini well past a normal
   20s timeout to synthesize. Only worth touching if you see "Read timed
   out" errors on a long book even at the default.

---

## 9. Deployed on Render

Live at:

- **Backend** (Docker web service): https://libralink-backend.onrender.com
- **Web portal** (static site): https://libralink-web.onrender.com
- **Postgres** (`libralink-db`): free instance, **expires September 3, 2026**
  unless upgraded to a paid plan before then.

Both services are on Render's free tier, so:

- Each spins down after inactivity — the first request after idle can take
  ~50s to wake back up.
- The Postgres DB above will be deleted at expiry unless upgraded.

`render.yaml` at the repo root describes the same 3-resource setup (DB +
backend + static site) as a Blueprint, but Render's free tier doesn't support
Blueprint deploys — this deployment was actually created by hand, one service
at a time, mirroring what's in `render.yaml`. Keep that file around as a
reference (or to use for real if the account is ever upgraded); it's not
currently wired to the live deployment via Render's Blueprint feature.

**How it's wired up:**

- Backend env vars are set directly on the `libralink-backend` service
  (Environment tab), using the real values from `Backend/.env` — see
  `Backend/.env.example` for the full list of keys.
- `ALLOWED_ORIGINS` on the backend is set to the web portal's URL above (CORS
  would otherwise block it).
- `VITE_API_BASE_URL` on the web portal is set to the backend's URL above.
  Vite inlines this at build time, so changing it requires a manual redeploy
  of `libralink-web`, not just an env var save.
- The web portal's **Redirects/Rewrites** setting (Settings →
  Redirects/Rewrites) has `/* → /index.html` as a **Rewrite**, so client-side
  routes like `/librarian` don't 404 on refresh.
- `SEED_DEMO_ENABLED` is left unset/`false` in production so demo data isn't
  seeded into the real database. Note: the backend actively **refuses to
  start** if `SEED_ADMIN_PASSWORD` is left at a weak/default value while
  `SEED_DEMO_ENABLED=false` — use a real password.

**Redeploying after future pushes**: each service auto-deploys on push to
`main` (Auto-Deploy is "On Commit"). Verify with
`curl https://libralink-backend.onrender.com/api/institutions` (should
respond, not connection-refused) and by loading
https://libralink-web.onrender.com/login.

---
