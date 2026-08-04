-- Generic invite/code table serving three distinct flows via `code_type`:
--   SCHOOL_CODE       - Platform Super Admin -> first School Admin of a new school
--   SCHOOL_ADMIN_OTP  - existing School Admin -> a co-School-Admin invite (email + expiry)
--   LIBRARIAN_CODE    - School Admin -> Librarian signup code
-- One table, one set of validation rules (unused/expiry/used-by), reusable for any future
-- invite-gated signup without a schema rewrite.
--
-- `code_hash` is a BCrypt hash of the raw code (via the app's existing PasswordEncoder
-- bean) - the actual security boundary. `code_lookup_hash` is a fast, unsalted SHA-256
-- digest used only to narrow a lookup to one row before the BCrypt comparison runs; it is
-- not itself the security boundary; it's what the DB index is built on.
--
-- Rollback: see rollback/R2__drop_invite_codes.sql

CREATE TABLE invite_codes (
    id BIGSERIAL PRIMARY KEY,
    code_type VARCHAR(30) NOT NULL,
    school_id INTEGER NOT NULL REFERENCES institutions(institution_id),
    email VARCHAR(150),
    target_role VARCHAR(30) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    code_lookup_hash VARCHAR(64) NOT NULL,
    issued_by_user_id INTEGER REFERENCES users(id),
    expires_at TIMESTAMP,
    used_at TIMESTAMP,
    used_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_invite_codes_lookup ON invite_codes(code_lookup_hash);
CREATE INDEX idx_invite_codes_school ON invite_codes(school_id, code_type);
