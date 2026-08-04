package com.codequest.libralink.dto;

/**
 * List/detail view of a school. Never carries a plaintext code (codes are hashed at rest
 * and shown to the caller exactly once, at creation/regeneration time) - only whether one
 * is currently pending.
 */
public class SchoolResponse {

    private Integer id;
    private String name;
    private String shortName;
    private String status;
    private boolean schoolCodePending;
    private long userCount;
    private long bookCount;
    private long schoolAdminCount;
    private String emailDomain;

    public SchoolResponse(Integer id, String name, String shortName, String status,
                           boolean schoolCodePending, long userCount, long bookCount, long schoolAdminCount,
                           String emailDomain) {
        this.id = id;
        this.name = name;
        this.shortName = shortName;
        this.status = status;
        this.schoolCodePending = schoolCodePending;
        this.userCount = userCount;
        this.bookCount = bookCount;
        this.schoolAdminCount = schoolAdminCount;
        this.emailDomain = emailDomain;
    }

    public Integer getId() { return id; }
    public String getName() { return name; }
    public String getShortName() { return shortName; }
    public String getStatus() { return status; }
    public boolean isSchoolCodePending() { return schoolCodePending; }
    public long getUserCount() { return userCount; }
    public long getBookCount() { return bookCount; }
    public long getSchoolAdminCount() { return schoolAdminCount; }
    public String getEmailDomain() { return emailDomain; }
}
