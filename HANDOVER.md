# LibraLink Multi-School Retrofit — Handover Prompt

Paste this whole document as your first message in the new chat.

---

## Context

I'm continuing work on a multi-tenant ("multi-school") retrofit of LibraLink, a
library management system: Spring Boot 4.1.0 / Java 21 backend, Expo/React
Native mobile app, PostgreSQL. Repo root: `/Users/mac/Desktop/LibraLink`.
**Git branch: `web-app`** (confirmed intentional — do not switch branches).
Nothing in this work has been committed yet; everything is uncommitted
working-tree state on top of `web-app`.

The original task spec is at `/Users/mac/Downloads/libralink-multischool-prompt.md`
(read it if you need the verbatim requirements). A full implementation plan,
written and approved earlier in this effort, is at:
`/Users/mac/.claude/plans/users-mac-downloads-libralink-multischo-keen-spark.md`
— **read this plan file first**, it has the phase-by-phase design in detail.
This handover doc summarizes what's already been *built* against that plan,
what's left, and pitfalls already discovered so you don't rediscover them.

### Key architectural decisions already made (don't relitigate these)

- **`Institution` entity IS "School"** — no separate School entity. Extended
  with `status`/`suspended_at`. `institutionId` and the new `schoolId` carry
  the same value everywhere.
- **School-scoping enforcement is manual**, via a new `SchoolContext` helper
  class + per-service checks — deliberately *not* Hibernate filters or AOP,
  to match this codebase's existing all-manual-checks style.
- **Flyway** owns the schema now (`ddl-auto=validate`), not `ddl-auto=update`.
- **Global reference data** (`Author`, `Publisher`, `Category`, `Role`) is
  *not* school-scoped — shared across all schools.
- **One generic `invite_codes` table** (`InviteCode` entity) serves all three
  code types: `SCHOOL_CODE`, `SCHOOL_ADMIN_OTP`, `LIBRARIAN_CODE`.
- **`ADMIN` role is kept permanently**, not renamed — `SCHOOL_ADMIN` was added
  as a new, co-equal role (existing seeded admin + tests depend on `ADMIN`
  surviving).
- **Lecturer and Podcast features were deleted entirely** (Phase 0, below) —
  the `web-app` branch had them active; user explicitly asked for full removal
  before the retrofit, not a carve-out.

---

## What's done (Phases 0–5, all complete and tested)

**Current backend test count: 87/87 passing** (`cd Backend && ./mvnw test`).
Web portal builds and typechecks cleanly (`cd Web && npm run build`).

### Phase 0 — Removed Lecturer + Podcast
Deleted `PodcastShow`/`PodcastEpisode` (entity/repo/service/controller),
`register-lecturer` endpoint, `LECTURER` role handling in `DataSeeder`.
`CourseController`/`ReadingListController`/`ReadingListItemController`
re-owned from `hasAnyRole('LIBRARIAN','LECTURER')` to staff-only. Mobile:
deleted `lecturer-signin.tsx`, `lecturer-signup.tsx`, `lecturer/`, `podcasts/`,
`services/podcasts.ts`; fixed references in `index.tsx`, `role-select.tsx`,
`_layout.tsx`, `signin.tsx`, `profile.tsx`, `course/index.tsx`, `audio.tsx`.

### Phase 1 — Flyway + School schema
5 migrations in `Backend/src/main/resources/db/migration/` (`V1`–`V5`), with
hand-maintained rollback scripts in `db/migration/rollback/` (`R1`–`R5`,
Flyway Community has no auto-undo). `school_id` added to all 20 tenant-scoped
entities (`BorrowRecord`, `Fine`, `FinePayment`, `Reservation`, `PickupSlot`,
`Notification`, `ReadingList`, `ReadingListItem`, `StudentReadingProgress`,
`BookCopy`, `BookView`, `AudioTrack`, `AudioBookTrack`, `ExamQuestion`,
`StudySession`, `StudySummary`, `UserAudioProgress`, `AuditLog`, `SearchLog`,
`VoiceCommand`), backfilled to a `DEFAULT` institution, then enforced
`NOT NULL`. `Book.institution` is `NOT NULL`; `User.institution` stays
nullable (only `PLATFORM_SUPER_ADMIN` has no school — enforced in app code,
not a DB constraint, since Postgres `CHECK` can't subquery another table).

**Note:** I originally also put a `school_code` column directly on
`Institution` in `V1`, then removed it — it would have duplicated the
`invite_codes` table as a second source of truth. `Institution` now only has
`status`/`suspended_at`; all code values live in `invite_codes`.

### Phase 2 — JWT + SchoolContext + isolation
- `security/AuthenticatedUser.java` (new principal record: userId, email,
  schoolId, roles), `security/SchoolContext.java` (`requireSchoolId()`,
  `currentSchoolId()`, `isPlatformSuperAdmin()`, `assertSameSchool()`,
  `resolveTargetSchoolId()`).
- JWT now carries a `schoolId` claim (`JwtUtil`, `JwtAuthenticationFilter`).
- `security/Roles.java` — `STAFF`, `PLATFORM_ADMIN_ONLY`, `SCHOOL_ADMIN_ONLY`
  constants, replacing ~26 duplicated `@PreAuthorize` literals.
- Every service that creates a scoped entity now stamps a real `schoolId`
  (derived from the related Book/Course/Fine, or `SchoolContext` for staff
  actions) — never trusted from client input.
- Closed a real pre-existing gap: `GET /api/users` / `GET /api/users/{id}`
  had **zero** auth before this; now staff-only (list) / self-or-staff
  (by-id), both school-scoped.
- Isolation *query filtering* (not just stamping) done for: Users, Books,
  BorrowRecords, Reservations. **Not** done exhaustively for the other 16
  scoped entities — see "Known gaps" below.
- Along the way, fixed a real bug in `BorrowRecordService`: it was merging a
  client-supplied partial `Book` sub-object via `bookRepository.save()`,
  which would silently null out fields the client didn't send.
- Tests: `CrossSchoolIsolationTest`, `RoleBoundaryTest`.

### Phase 3 — `school_code` signup
`InviteCode` entity/repo, `InviteCodeService` (issue/validate/consume, split
into two steps so a rejected signup never burns a code), `util/CodeGenerator`
(human-typeable codes, ambiguous chars excluded), `SchoolService` +
`SchoolController`: `POST/GET /api/schools`, `PATCH /api/schools/{id}`
(suspend/reactivate/regenerate), all `PLATFORM_SUPER_ADMIN`-only.
`POST /api/auth/school-admin-signup` (public) validates the code, creates
the first `SCHOOL_ADMIN`. Tests: `SchoolControllerTest`,
`SchoolAdminSignupTest`.

### Phase 4 — OTP invite + `librarian_code`
`POST /api/school-admins/invite` (SCHOOL_ADMIN/ADMIN/PLATFORM_SUPER_ADMIN
only — **not** Librarian — via `Roles.SCHOOL_ADMIN_ONLY`) generates a 15-min
OTP, rate-limited 5/hour/school. **No email infrastructure exists in this
codebase at all**, so the OTP is returned directly in the API response,
clearly marked as dev/interim. `POST /api/auth/school-admin-join` (public)
consumes it. `POST /api/librarian-codes` (same gate) issues a no-expiry,
single-use librarian code. `POST /api/auth/register-librarian` now
**requires** a `librarianCode` validated against the caller's own school —
existing bearer-token gate unchanged, code layered on top. Had to update the
mobile `librarian-signup.tsx` screen (added a code input field) since this
broke the existing flow. Tests: `SchoolAdminInviteTest`, `LibrarianCodeTest`.

### Phase 5 — Web portal scaffold + auth
New `Web/` directory (sibling to `Backend/`/`Frontend/`): Vite + React 18 +
TypeScript + Tailwind, mirroring the mobile app's `services/api.ts` and
`AuthContext` patterns. `LoginPage`, `SchoolAdminSignupPage`,
`SchoolAdminJoinPage`, `LibrarianSignupPage` (staff-authenticated, not
public — reuses `register-librarian`'s bearer+code gate), role-based routing
via `RequireRole`, placeholder dashboards at `/platform`, `/school`,
`/librarian` (**Phase 6 replaces these with real dashboards**).

**Verified end-to-end against a real local Postgres**, not just the H2 test
suite — this surfaced and fixed two real Spring-Boot-4.x-specific bugs, worth
knowing so you don't rediscover them:
1. **Flyway silently never ran.** Spring Boot 4.x split autoconfiguration
   into many small per-feature modules — `flyway-core` alone no longer
   triggers Flyway (unlike 3.x). Fix: added explicit
   `org.springframework.boot:spring-boot-flyway` dependency to `pom.xml`.
2. **`V1` got silently skipped even after fixing #1.**
   `spring.flyway.baseline-on-migrate=true`'s default `baseline-version` is
   `1`, which treats a migration literally named `V1` as "already applied."
   Fix: `spring.flyway.baseline-version=0` in `application.properties`.

---

## Local dev environment notes

- Local Postgres DB `libralink` (not a remote/production DB — confirmed
  `localhost` in `Backend/.env`, which is git-ignored and already present).
  **This DB has leftover tables from a different branch** (`bookmarks`,
  `password_reset_codes`, `podcast_shows`/`podcast_episodes`) — harmless,
  just don't be surprised by them; they're not part of `web-app`'s schema.
- **Test data intentionally left in that DB** from Phase 5 verification:
  - `platform@libralink.test` / `platform123` — a `PLATFORM_SUPER_ADMIN`
    (created by hand via SQL role-swap, since there's no self-service path
    for that role by design).
  - "Accra Test Academy" school (institution id 3), with a `SCHOOL_ADMIN`
    (`ama.owusu@ata.test` / `pass1234`), a co-admin joined via OTP
    (`co.admin@ata.test` / `pass1234`), and a librarian
    (`kofi.mensah@ata.test` / `pass1234`). Useful for Phase 6 dashboard
    testing against a real second school. Ask the user if they want it
    cleaned up.
- To run the backend locally: `cd Backend && set -a && source .env && set +a
  && ./mvnw spring-boot:run` (`.env` isn't auto-loaded, must `source` it).
- To run the web portal: `cd Web && npm run dev` (needs `.env.local` with
  `VITE_API_BASE_URL=http://localhost:8080` — already present, gitignored).
  There's also a `.claude/launch.json` entry named `web-portal` for the
  `preview_start` browser tool (`npm run dev --prefix Web`).
- `./mvnw dependency:tree | grep -i flyway` is a good sanity check if Flyway
  ever seems to silently not run again.

---

## What's left

### Phase 6 — Web portal dashboards (the actual next task)
Per the plan file: replace the three placeholder dashboards
(`Web/src/pages/PlaceholderDashboard.tsx`, currently reused generically for
all three roles) with real UIs:
- **Platform Super Admin** (`/platform`): schools table (create → show code
  once, suspend/reactivate, regenerate code), cross-school stats. Backend
  already supports this fully (`GET /api/schools` returns per-school stats).
- **School Admin** (`/school`): invite co-admins (call
  `POST /api/school-admins/invite`, show the dev-mode OTP), issue librarian
  codes (`POST /api/librarian-codes`), list librarians/users/books scoped to
  own school (`GET /api/users`, `GET /api/books` are already school-scoped
  for authenticated non-platform callers).
- **Librarian** (`/librarian`): reuse the same API surface the mobile app
  already uses for books/loans/fines (`CirculationController`,
  `BorrowRecordService`, `FineService`) — no new backend logic needed, just
  UI against already-scoped endpoints.

You'll likely want a new `Web/src/api/schools.ts` (mirroring
`Web/src/api/auth.ts`'s shape) for the school/user/book list calls.

### Known gaps (flagged during work, not yet closed — ask the user whether any are in-scope now)
1. **School `SUSPENDED` status is stored and toggleable but not enforced
   anywhere** — a suspended school's staff can still act normally. No
   enforcement logic exists yet.
2. **Isolation query filtering is incomplete.** Only Users/Books/
   BorrowRecords/Reservations have actual list-scoping; the other 16
   scoped entities (Fine, PickupSlot, AuditLog, SearchLog, etc.) correctly
   *stamp* `schoolId` on write but their read/list endpoints aren't filtered
   by it yet.
3. **`GET /api/books/{id}` and `/api/books/search` stay unscoped** even for
   authenticated callers (only the list view `GET /api/books` is scoped) —
   a deliberate scope cut under time pressure, not a design decision.
4. **No real email delivery** — OTP invites return the code directly in the
   API response (clearly marked dev-only). Real email would need
   `spring-boot-starter-mail` + SMTP config, not built.
5. Nothing has been committed to git. At some point this large body of work
   should be committed (probably in logical chunks matching the phases) —
   ask the user before doing so, they haven't requested a commit yet.

---

## How to pick this up

1. Read the plan file (`/Users/mac/.claude/plans/users-mac-downloads-libralink-multischo-keen-spark.md`)
   for full design detail on anything above that's unclear.
2. Confirm current state: `cd Backend && ./mvnw test` should show 87/87
   passing; `cd Web && npm run build` should succeed.
3. Ask the user to confirm: proceed straight into Phase 6 dashboards? Handle
   any of the "known gaps" first? Something else entirely?
4. This session has been operating with **auto-mode bias toward continuing
   autonomously** without asking for confirmation at every step, but pausing
   at natural phase boundaries to report status — matching that pattern
   worked well; consider doing the same.
