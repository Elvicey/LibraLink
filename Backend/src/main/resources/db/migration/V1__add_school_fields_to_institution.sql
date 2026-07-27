-- Extends the existing single-tenant `institutions` table with the fields needed to act
-- as a first-class "School": a lifecycle status distinct from the pre-existing `is_active`
-- flag (which is never set false anywhere in the app today and has different semantics -
-- "does this row exist" vs "is this school allowed to operate"), and a suspension
-- timestamp. The actual school_code/OTP/librarian_code VALUES live only in the generic
-- `invite_codes` table (V2) - not duplicated here - so there is exactly one place that
-- knows how to hash, expire, and consume a code.
--
-- Rollback: see rollback/R1__drop_school_fields.sql

ALTER TABLE institutions
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN suspended_at TIMESTAMP;
