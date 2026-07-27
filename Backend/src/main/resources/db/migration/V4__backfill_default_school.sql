-- Creates one "DEFAULT" school and backfills every existing row across the newly
-- school_id-scoped tables to it. Safe to do unconditionally (no per-row lookup logic
-- needed): the entire pre-migration dataset is single-tenant by definition, since
-- multi-tenancy didn't exist until this migration set. No PLATFORM_SUPER_ADMIN role/user
-- can exist yet at this point in the migration history (that role is introduced in a
-- later application-level change, not before this backfill runs), so every existing user
-- row is safely backfilled too.

INSERT INTO institutions (name, short_name, tier, country, is_active, status, created_at, updated_at)
SELECT 'Default School (Legacy Data)', 'DEFAULT', 'BASIC', 'Ghana', true, 'ACTIVE', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM institutions WHERE short_name = 'DEFAULT');

DO $$
DECLARE
    default_school_id INTEGER;
BEGIN
    SELECT institution_id INTO default_school_id FROM institutions WHERE short_name = 'DEFAULT';

    UPDATE users SET institution_id = default_school_id WHERE institution_id IS NULL;
    UPDATE books SET institution_id = default_school_id WHERE institution_id IS NULL;

    UPDATE borrow_records           SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE fines                    SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE fine_payments            SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE reservations              SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE pickup_slots              SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE notifications             SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE reading_lists             SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE reading_list_items        SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE student_reading_progress  SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE book_copies               SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE book_views                SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE audio_tracks              SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE audio_book_tracks         SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE exam_questions            SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE study_sessions            SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE study_summaries           SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE user_audio_progress       SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE audit_logs                SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE search_logs               SET school_id = default_school_id WHERE school_id IS NULL;
    UPDATE voice_commands            SET school_id = default_school_id WHERE school_id IS NULL;
END $$;
