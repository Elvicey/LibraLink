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

By default the mobile app talks to the **deployed production backend**
(`https://libralink-rgp2.onrender.com`) — see
[`src/config/api.ts`](Frontend/LibraLink/src/config/api.ts). To exercise your
local backend and the multi-school changes instead, set the
`EXPO_PUBLIC_API_BASE_URL` env var (same convention as Web's
`VITE_API_BASE_URL` — Expo inlines `EXPO_PUBLIC_*` vars at build time, no
extra dependency needed):

```bash
cd Frontend/LibraLink
cp .env.example .env.local
```

Then open `.env.local` and uncomment the **one** line matching whichever
device you're running on (only one at a time):

- **iOS Simulator** — shares your Mac's network, `http://localhost:8080`
  works directly.
- **Android emulator** — `http://10.0.2.2:8080` (Android's alias for the
  host machine's localhost).
- **Physical device via Expo Go** — your Mac's LAN IP, e.g.
  `http://192.168.x.x:8080` (find it with `ipconfig getifaddr en0`). The
  phone must be on the same Wi-Fi network, and nothing (like a firewall)
  should be blocking inbound connections to port 8080.

`.env.local` is git-ignored (`.env*.local` in `Frontend/LibraLink/.gitignore`),
so this stays a personal override — no risk of accidentally committing a
localhost URL. Delete or comment it out to fall back to production again.

Restart `npx expo start` after changing `.env.local` — env vars are read at
bundler startup, not hot-reloaded.

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

A 4th school, **Tema Community Day School**, was also created during Phase 6
verification with no admin yet (its school code was consumed by the demo —
regenerate a new one from the Platform dashboard if you want to sign up an
admin for it).

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

- **Flyway silently doesn't run / `V1` gets skipped** — see the two
  Spring-Boot-4.x-specific bugs already fixed and documented in
  `HANDOVER.md` (missing `spring-boot-flyway` dependency; `baseline-version`
  default of `1` treating `V1` as already applied). Both fixes are already
  in `pom.xml` / `application.properties` — this is just a pointer if it
  ever regresses.
- **`./mvnw dependency:tree | grep -i flyway`** — sanity check if Flyway
  ever seems to silently not run.
- **CORS "Failed to fetch" on PATCH requests from the Web portal** — fixed
  in `SecurityConfig.corsConfigurationSource()` (was missing `PATCH` from
  `allowedMethods`, breaking `PATCH /api/schools/{id}`). If you see this
  again for a different method, check that list first.
- **Port 8080 already in use** — `lsof -i :8080 -sTCP:LISTEN -t` to find the
  PID, or a previous background run may still be alive.
