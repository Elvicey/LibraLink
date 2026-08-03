-- Adds a uniqueness guarantee on users.student_id ahead of it becoming the
-- librarian-facing lookup key for identifying students (replacing raw numeric user ids
-- in staff workflows - see CirculationScan/FinesLookup on the Web portal). Postgres
-- UNIQUE constraints treat NULL as distinct from any other NULL, so this is safe to add
-- without a backfill - existing rows with no student_id are unaffected.
--
-- Rollback: see rollback/R6__drop_unique_student_id.sql

ALTER TABLE users ADD CONSTRAINT uq_users_student_id UNIQUE (student_id);
