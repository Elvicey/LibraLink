package com.codequest.libralink.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "institutions")
public class Institution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "institution_id")
    private Integer institutionId;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String name;

    // Medium: shortName is used as a short human-facing code for the institution; nothing
    // stopped two institutions from being created with the same one. Plain unique columns
    // allow multiple NULLs, so institutions that don't set a shortName are unaffected.
    @Column(name = "short_name", length = 50, unique = true)
    private String shortName;

    @Column(nullable = false, length = 20)
    private String tier = "BASIC";

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String country = "Ghana";

    @Email
    @Column(length = 150)
    private String email;

    @Column(length = 30)
    private String phone;

    // Gates student self-registration (AuthService.registerWithRole): null/blank means "no
    // restriction, any email accepted" - the default for every school unless a Platform
    // Super Admin sets one. Not used anywhere else.
    @Column(name = "email_domain", length = 150)
    private String emailDomain;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    // "School" fields (multi-tenant retrofit). institutionId is the school id everywhere
    // else in the codebase - Institution IS School, not a separate concept. The actual
    // school_code/OTP/librarian_code values live only in InviteCode - not duplicated here.

    // ACTIVE | SUSPENDED. Distinct from isActive above (which is never set false anywhere
    // in the app and has different semantics - "does this row exist" vs "is this school
    // allowed to operate").
    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "suspended_at")
    private LocalDateTime suspendedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // --- Constructors ---
    public Institution() {}

    public Institution(String name, String shortName, String tier, String city, String email, String phone) {
        this.name = name;
        this.shortName = shortName;
        this.tier = tier;
        this.city = city;
        this.email = email;
        this.phone = phone;
    }

    // --- Getters and Setters ---
    public Integer getInstitutionId() { return institutionId; }
    public void setInstitutionId(Integer institutionId) { this.institutionId = institutionId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getShortName() { return shortName; }
    public void setShortName(String shortName) { this.shortName = shortName; }

    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmailDomain() { return emailDomain; }
    public void setEmailDomain(String emailDomain) { this.emailDomain = emailDomain; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getSuspendedAt() { return suspendedAt; }
    public void setSuspendedAt(LocalDateTime suspendedAt) { this.suspendedAt = suspendedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}