# LibraLink — Tech Stack, Architecture & How the App Works

**Product:** LibraLink — an institutional academic library platform for Ghanaian (and similar) campuses  
**Repository shape:** Monorepo with `Backend/` (API) and `Frontend/LibraLink/` (mobile app)  
**Live API (current):** `https://libralink-rgp2.onrender.com`

---

## 1. What LibraLink Is

LibraLink connects **students**, **lecturers**, **librarians**, and **admins** around one shared library system:

| Role | Primary job in the app |
|------|-------------------------|
| **Student** | Browse the catalogue, reserve/borrow, pay fines, follow published course reading lists, use study tools (Ask Libra, audio, podcasts) |
| **Lecturer** | Lecture-to-Library: manage courses, build and publish reading lists, assign catalogue titles, trigger low-stock alerts |
| **Librarian / Admin** | Staff console: circulation, inventory, staff accounts; **Admin-only** institutional reports |

The product is designed so the **library is not a passive store of books**, but part of teaching delivery (reading lists linked to courses, notifications when resources become available, alerts when lecture demand exceeds stock).

---

## 2. Tech Stack Overview

```text
┌─────────────────────────────────────────────────────────┐
│  Mobile / Web client (Expo + React Native + TypeScript) │
│  Auth token in AsyncStorage → REST JSON over HTTPS      │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│  Spring Boot API (Java 21) on Render                    │
│  Spring Security + JWT · Spring Data JPA                │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL (managed DB; credentials via env vars)      │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Stack — What, How, Why

| Technology | How it is used | Why it is used |
|------------|----------------|----------------|
| **Expo (SDK 54)** | App runtime, build tooling, native modules (`expo-speech`, splash, fonts, linking) | Fast mobile delivery for Android/iOS without maintaining a full native Xcode/Android Studio project for day-to-day work |
| **React Native 0.81** | UI components, navigation shells, device APIs | One codebase for campus users on phones (primary target for students) |
| **React 19** | Component model for screens and shared UI | Industry-standard UI programming model; matches Expo’s supported stack |
| **TypeScript** | Typed services (`books.ts`, `courses.ts`, …) and screen props | Catches API shape mistakes early; documents contracts with the backend |
| **Expo Router** | File-based routes under `src/app/` (`(tabs)/`, `lecturer/`, `book/[id]`, …) | Clear screen map that mirrors product areas (student tabs vs lecturer hub vs admin) |
| **AsyncStorage** | Persists JWT, userId, roles, institutionId | Keeps sessions across app restarts without a separate auth SDK |
| **Central `api.ts` + `API_BASE_URL`** | All authenticated calls attach `Authorization: Bearer …` | One place to talk to Render; services stay thin and consistent |
| **expo-speech** | Podcast “Literary Voices” narration | Delivers book-discussion audio without hosting large media files for every episode |
| **Ionicons / theme tokens** | Shared look across student, lecturer, and staff screens | Visual consistency without a heavy design-system package |

**Frontend layout (simplified):**

- `src/app/` — screens (routing)
- `src/services/` — REST clients (books, borrows, fines, courses, podcasts, AI, audio, reservations)
- `src/contexts/AuthContext.tsx` — session state
- `src/components/common/` — Button, Card, ScreenWrapper, Input
- `src/constants/theme.ts` — colours, spacing, dark/light

---

## 4. Backend Stack — What, How, Why

| Technology | How it is used | Why it is used |
|------------|----------------|----------------|
| **Java 21** | Language for all server code | Modern LTS; strong typing for domain rules (loans, fines, roles) |
| **Spring Boot 4.x** | Application framework, HTTP servers, DI | Mature ecosystem for secure REST APIs and university-style backends |
| **Spring Web (MVC)** | Controllers under `/api/...` | Clear resource-oriented endpoints the mobile app can call |
| **Spring Data JPA + Hibernate** | Entities ↔ PostgreSQL tables (`ddl-auto=update`) | Rapid evolution of schema (courses, reading lists, podcasts, audio tracks) without hand-writing every migration early on |
| **PostgreSQL** | System of record for users, books, loans, fines, courses, notifications | Reliable relational model for inventory, foreign keys, and multi-user concurrency |
| **Spring Security** | Stateless filter chain; role checks (`STUDENT`, `LECTURER`, `LIBRARIAN`, `ADMIN`) | Protects write endpoints; public GETs for catalogue discovery |
| **JWT (jjwt)** | Login/register return a signed token (~24h) | Mobile-friendly auth: no server session sticky state on Render |
| **Bean Validation** | Request DTOs (e.g. register email/password) | Rejects bad input before business logic runs |
| **Maven** | Build and dependency management (`mvnw`) | Standard Java packaging for Render deploy |
| **DataSeeder (CommandLineRunner)** | Seeds admin, demo student/lecturer, catalogue, courses, podcasts, audio tracks | Makes demos and QA possible on a fresh database |

**Backend layout (simplified):**

- `controller/` — HTTP boundary  
- `service/` — business rules (borrow, publish list, low-stock alerts, payments)  
- `entity/` + `repository/` — persistence  
- `security/` — JWT filter + user details  
- `config/` — Security, CORS, seeder  
- `dto/` — auth and AI request/response shapes  

---

## 5. Hosting & Integration Glue

| Piece | Role | Why |
|-------|------|-----|
| **Render** | Hosts the Spring Boot API | Simple deploy from Git (`Victoria` branch); HTTPS for the mobile client |
| **Environment variables** | `SPRING_DATASOURCE_*`, `JWT_SECRET` | Secrets stay out of source; same code works locally and in production |
| **CORS `*` on `/api/**`** | Allows Expo/dev clients to call the API | Campus apps and web previews need cross-origin access during development |
| **Postman collection** (repo) | Manual API regression | Validates endpoints independently of the UI |

---

## 6. How the App Works (End-to-End)

### 6.1 Entry and roles

1. User opens LibraLink and picks a role (Student, Lecturer, Librarian, Admin).  
2. Sign-in/sign-up calls `/api/auth/login` or `/api/auth/register*`.  
3. Backend returns `{ token, userId, roles, institutionId, … }`.  
4. The app stores the session and routes by role:
   - Student → tabbed academic app (home, search, borrowed, AI, profile)  
   - Lecturer → Lecture-to-Library hub (`/lecturer`)  
   - Librarian/Admin → staff console (`/admin`); Reports are Admin-only  

**Why this way:** One product, four jobs. Mixing lecturer tooling into the student home screen confused workflows; separate portals keep each role focused while sharing one catalogue and database.

### 6.2 Catalogue and borrowing

1. Students load books via public/authenticated GETs (`/api/books`, search).  
2. Book detail can create a **reservation** and schedule a **pickup slot** (QR for desk collection).  
3. Active loans and history come from `/api/borrow-records/user/{id}` (checkout itself remains staff-controlled — librarians create borrow records).  
4. Fines are listed per user; students pay through `/api/fine-payments` (e.g. Ghana MoMo-style phone entry on the client).

**Why this way:** Real libraries separate *discovery* (anyone) from *issuing* (staff). Students can reserve and schedule pickup; circulation authority stays with librarians.

### 6.3 Lecture-to-Library & Course Reading Lists

1. Lecturers create/select courses under an institution.  
2. They create reading lists (required / recommended / further), assign titles from the catalogue, and **publish**.  
3. Publishing notifies students; assigning a low-stock title notifies librarians/admins.  
4. Students open **Reading lists** and see only **published** lists, with availability and personal progress (`reading` / `completed` / `saved`).

**Why this way:** Replaces paper/WhatsApp reading lists with a trackable, catalogue-linked workflow that couples teaching to stock.

### 6.4 Academic extras

| Feature | Mechanism |
|---------|-----------|
| **Ask Libra** | Client → `POST /api/ai/chat` (intent-style answers + catalogue hints; local fallback if offline) |
| **Audio Reader** | Client → `/api/audio-tracks` (+ progress) for lecture/textbook listening |
| **Podcasts** | Client → `/api/podcasts`; playback can use `expo-speech` scripts tied to books |
| **Notifications** | Stored server-side; push channel prepared (e.g. Expo push token on user) |

**Why this way:** Extends the library into study habits without requiring a second app.

### 6.5 Security model (short)

- **Stateless JWT** on almost all mutating routes.  
- Catalogue GETs are often `permitAll` so browsing works before deep login friction.  
- Method security (`@PreAuthorize`) enforces lecturer/librarian/admin privileges on write paths.  
- Reports and sensitive staff actions stay behind Admin/Librarian roles.

**Why this way:** Matches mobile usage (token in storage) and least-privilege for institutional data.

---

## 7. Why the Overall Architecture Looks Like This

1. **Campus-first mobile UX** — Students live on phones; Expo/React Native is the shortest path to a usable campus app.  
2. **Authoritative server** — Loans, fines, stock, and published lists must not be trusted to the device alone; Spring + PostgreSQL own the truth.  
3. **Institutional multi-role product** — Role portals avoid forcing one “dashboard” on everyone.  
4. **Curriculum integration** — Courses and reading lists are first-class entities, not PDF attachments, so analytics and stock alerts are possible.  
5. **Deployability for demos/hackathons** — Render + env-configured Postgres + seeder accounts let the team ship and test without local DB theatre.  
6. **Incremental feature growth** — Controllers/services/entities grow feature-by-feature (podcasts, AI, audio-tracks) without rewriting the client shell.

---

## 8. Key Demo Accounts (seeded)

| Role | Email | Password (typical seed) |
|------|--------|-------------------------|
| Admin | `admin@libralink.com` | `admin123` |
| Student | `student@libralink.com` | `student123` |
| Lecturer | `lecturer@knust.edu.gh` | `lecturer123` |

*(Confirm against current `DataSeeder` if credentials change.)*

---

## 9. One-Paragraph Summary

**LibraLink** is a **Spring Boot + PostgreSQL** library API secured with **JWT**, consumed by an **Expo React Native** app that routes users into student, lecturer, or staff experiences. Students discover and reserve resources, track reading lists, and use study tools; lecturers publish curriculum-linked lists that drive demand signals to librarians; admins oversee reports and the institutional catalogue. The stack was chosen for **mobile reach**, **relational integrity**, **role-based security**, and **fast iteration** on a shared academic library product.

---

*Document generated from the LibraLink monorepo structure and current Victoria-line integration.*
