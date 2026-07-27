package com.codequest.libralink.dto;

/** Returned exactly once - at school creation and at code regeneration - since the raw
 *  code is never retrievable again afterward (only its BCrypt hash is stored). */
public class SchoolCodeResponse {

    private Integer schoolId;
    private String name;
    private String shortName;
    private String status;
    private String schoolCode;

    public SchoolCodeResponse(Integer schoolId, String name, String shortName, String status, String schoolCode) {
        this.schoolId = schoolId;
        this.name = name;
        this.shortName = shortName;
        this.status = status;
        this.schoolCode = schoolCode;
    }

    public Integer getSchoolId() { return schoolId; }
    public String getName() { return name; }
    public String getShortName() { return shortName; }
    public String getStatus() { return status; }
    public String getSchoolCode() { return schoolCode; }
}
