-- Runs only after V4 has committed the backfill (separate migration file, not combined
-- with V4, so a NOT NULL failure can never happen mid-backfill).
--
-- `users.institution_id` is deliberately LEFT NULLABLE here: Postgres CHECK constraints
-- cannot subquery another table, so "non-null unless the user is PLATFORM_SUPER_ADMIN"
-- cannot be expressed as a DB-level constraint. That invariant is enforced in application
-- code only (AuthService / UserService) - see SchoolContext and the school-admin-signup /
-- register-librarian flows. A raw SQL insert could still bypass it; this is a deliberate,
-- documented trade-off, not an oversight.
--
-- Rollback: see rollback/R5__relax_not_null.sql

ALTER TABLE books ALTER COLUMN institution_id SET NOT NULL;

ALTER TABLE borrow_records           ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE fines                    ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE fine_payments            ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE reservations             ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE pickup_slots             ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE notifications            ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE reading_lists            ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE reading_list_items       ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE student_reading_progress ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE book_copies              ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE book_views               ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE audio_tracks             ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE audio_book_tracks        ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE exam_questions           ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE study_sessions           ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE study_summaries          ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE user_audio_progress      ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE audit_logs               ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE search_logs              ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE voice_commands           ALTER COLUMN school_id SET NOT NULL;
