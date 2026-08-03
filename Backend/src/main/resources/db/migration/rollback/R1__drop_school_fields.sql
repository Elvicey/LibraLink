-- Manual rollback for V1__add_school_fields_to_institution.sql. Not auto-run by Flyway
-- (Community Edition has no automatic undo) - an operator runs this by hand if needed.
ALTER TABLE institutions
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS suspended_at;
