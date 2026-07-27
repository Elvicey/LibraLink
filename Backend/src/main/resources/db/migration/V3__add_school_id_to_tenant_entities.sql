-- Adds a school_id column (nullable for now - backfilled in V4, made NOT NULL in V5) to
-- every tenant-scoped table that has no institution/school linkage today. `users` and
-- `books` already have `institution_id` (nullable) and are left alone here - only their
-- NOT NULL enforcement changes, in V5. `courses` is already NOT NULL and untouched.
--
-- Excluded deliberately (global reference data, not tenant-scoped): authors, publishers,
-- categories, roles.
--
-- Rollback: see rollback/R3__drop_school_id_columns.sql

ALTER TABLE borrow_records          ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE fines                   ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE fine_payments           ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE reservations            ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE pickup_slots            ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE notifications           ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE reading_lists           ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE reading_list_items      ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE student_reading_progress ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE book_copies             ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE book_views              ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE audio_tracks            ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE audio_book_tracks       ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE exam_questions          ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE study_sessions          ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE study_summaries         ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE user_audio_progress     ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE audit_logs              ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE search_logs             ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
ALTER TABLE voice_commands          ADD COLUMN school_id INTEGER REFERENCES institutions(institution_id);
