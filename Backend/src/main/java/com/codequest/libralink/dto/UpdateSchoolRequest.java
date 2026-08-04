package com.codequest.libralink.dto;

public class UpdateSchoolRequest {

    /** ACTIVE | SUSPENDED - omit to leave status unchanged. */
    private String status;

    /** true to invalidate the current unused school_code and issue a new one. */
    private Boolean regenerateCode;

    /**
     * Registered email domain (e.g. "knust.edu.gh") gating student self-registration.
     * Unlike status, blank is a meaningful value here rather than "ignore": omit the field
     * entirely (null) to leave it unchanged, or send "" to explicitly clear/disable the
     * restriction.
     */
    private String emailDomain;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getRegenerateCode() { return regenerateCode; }
    public void setRegenerateCode(Boolean regenerateCode) { this.regenerateCode = regenerateCode; }

    public String getEmailDomain() { return emailDomain; }
    public void setEmailDomain(String emailDomain) { this.emailDomain = emailDomain; }
}
