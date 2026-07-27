package com.codequest.libralink.dto;

public class UpdateSchoolRequest {

    /** ACTIVE | SUSPENDED - omit to leave status unchanged. */
    private String status;

    /** true to invalidate the current unused school_code and issue a new one. */
    private Boolean regenerateCode;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getRegenerateCode() { return regenerateCode; }
    public void setRegenerateCode(Boolean regenerateCode) { this.regenerateCode = regenerateCode; }
}
