# LibraLink Backend

Spring Boot 4 / Java 21 REST API for LibraLink.

## Setup

1. Copy `.env.example` to `.env` (or otherwise inject the same variables into your
   environment) and fill in real values:

   ```
   cp .env.example .env
   ```

2. **Required, no defaults** - the app will not start without these:
   - `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
     - a running PostgreSQL instance matching these credentials
   - `JWT_SECRET` - a long, random, high-entropy secret (never reuse the sample value)

3. **Optional** (features are disabled/unavailable until set, see `.env.example` for
   details): `SEED_ADMIN_*`, `EXPO_PUSH_ENABLED`, `TTS_API_*`, `AI_API_*`.

4. Run the app:

   ```
   ./mvnw spring-boot:run
   ```

   On first startup with an empty database, `DataSeeder` creates the schema
   (`spring.jpa.hibernate.ddl-auto=update`) and seeds an initial ADMIN account using the
   `SEED_ADMIN_*` variables (defaults to `admin@libralink.com` / `admin123` if unset -
   **always override `SEED_ADMIN_PASSWORD` outside of local development**).

## Tests

Tests run against an in-memory H2 database and don't require any of the above to be
configured:

```
./mvnw test
```
