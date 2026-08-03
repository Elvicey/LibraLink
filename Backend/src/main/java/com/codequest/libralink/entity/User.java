package com.codequest.libralink.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    // Institution = School. Nullable only for PLATFORM_SUPER_ADMIN users (not
    // school-scoped); every other role must have one. Enforced in application code
    // (AuthService / school-admin-signup / school-admin-join / register-librarian),
    // not as a DB constraint - Postgres CHECK constraints can't subquery the roles
    // table to express "non-null unless role X".
    @ManyToOne
    @JoinColumn(name = "institution_id")
    private Institution institution;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    // WRITE_ONLY (not @JsonIgnore): @JsonIgnore on the field blocks BOTH directions, which
    // silently dropped passwordHash on the way in too - POST /api/users (registerUser) could
    // never actually set a password, always failing "password is required" no matter what
    // the request body sent. WRITE_ONLY still keeps it out of every response (the field is
    // never populated from a read query result set through this entity's JSON output), it
    // just stops blocking deserialization.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "password", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    @Column(name = "student_id", length = 8, unique = true)
    private String studentId;

    @Column(name = "index_number", length = 7)
    private String indexNumber;

    @Column(name = "programme", length = 150)
    private String programme;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "push_token", length = 500)
    private String pushToken;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    // Defaults true (see V7 migration) so every existing account and every OTHER signup
    // path (librarian, school admin, platform admin, admin-created) is unaffected - only
    // student self-registration (AuthService.register) explicitly sets this false, and
    // login() rejects an unverified account.
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = true;

    public User() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Institution getInstitution() { return institution; }
    public void setInstitution(Institution institution) { this.institution = institution; }

    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getIndexNumber() { return indexNumber; }
    public void setIndexNumber(String indexNumber) { this.indexNumber = indexNumber; }

    public String getProgramme() { return programme; }
    public void setProgramme(String programme) { this.programme = programme; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public String getPushToken() { return pushToken; }
    public void setPushToken(String pushToken) { this.pushToken = pushToken; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
}