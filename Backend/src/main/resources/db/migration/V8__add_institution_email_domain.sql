-- Per-school email-domain restriction for student self-registration. NULL/blank (the
-- default, and the value for every existing school today) means "no restriction - any
-- email is accepted" - only AuthService.registerWithRole enforces this.
--
-- Rollback: see rollback/R8__drop_institution_email_domain.sql

ALTER TABLE institutions ADD COLUMN email_domain VARCHAR(150);
