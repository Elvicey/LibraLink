package com.codequest.libralink.dto;

import java.util.List;

public class AuthResponse {

    private String token;
    private Integer userId;
    private String email;
    private String firstName;
    private String lastName;
    private List<String> roles;
    private Integer institutionId;
    private String schoolShortName;

    public AuthResponse(String token, Integer userId, String email, String firstName, String lastName,
                        List<String> roles, Integer institutionId, String schoolShortName) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.roles = roles;
        this.institutionId = institutionId;
        this.schoolShortName = schoolShortName;
    }

    public String getToken() { return token; }
    public Integer getUserId() { return userId; }
    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public List<String> getRoles() { return roles; }
    public Integer getInstitutionId() { return institutionId; }

    // Institution = School. Same underlying value as institutionId, exposed under the
    // forward-looking name the new web portal standardizes on; the mobile app keeps
    // reading institutionId unchanged.
    public Integer getSchoolId() { return institutionId; }

    // Null for PLATFORM_SUPER_ADMIN (no institution). Lets the web portal display
    // "ATA" instead of a raw numeric school id.
    public String getSchoolShortName() { return schoolShortName; }
}
