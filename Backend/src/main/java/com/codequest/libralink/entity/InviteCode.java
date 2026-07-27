package com.codequest.libralink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Generic invite/code row serving three distinct flows via {@code codeType}:
 * SCHOOL_CODE (Platform Super Admin -> first School Admin), SCHOOL_ADMIN_OTP (School Admin
 * -> co-admin invite), LIBRARIAN_CODE (School Admin -> Librarian signup). One table, one
 * set of validation rules, reusable for any future invite-gated signup.
 */
@Entity
@Table(name = "invite_codes")
public class InviteCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code_type", nullable = false, length = 30)
    private String codeType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "school_id", nullable = false)
    private Institution school;

    @Column(length = 150)
    private String email;

    @Column(name = "target_role", nullable = false, length = 30)
    private String targetRole;

    @Column(name = "code_hash", nullable = false, length = 255)
    private String codeHash;

    @Column(name = "code_lookup_hash", nullable = false, length = 64)
    private String codeLookupHash;

    @Column(name = "issued_by_user_id")
    private Integer issuedByUserId;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "used_by_user_id")
    private Integer usedByUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public InviteCode() {}

    public boolean isValid() {
        return usedAt == null && (expiresAt == null || expiresAt.isAfter(LocalDateTime.now()));
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCodeType() { return codeType; }
    public void setCodeType(String codeType) { this.codeType = codeType; }

    public Institution getSchool() { return school; }
    public void setSchool(Institution school) { this.school = school; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public String getCodeHash() { return codeHash; }
    public void setCodeHash(String codeHash) { this.codeHash = codeHash; }

    public String getCodeLookupHash() { return codeLookupHash; }
    public void setCodeLookupHash(String codeLookupHash) { this.codeLookupHash = codeLookupHash; }

    public Integer getIssuedByUserId() { return issuedByUserId; }
    public void setIssuedByUserId(Integer issuedByUserId) { this.issuedByUserId = issuedByUserId; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public LocalDateTime getUsedAt() { return usedAt; }
    public void setUsedAt(LocalDateTime usedAt) { this.usedAt = usedAt; }

    public Integer getUsedByUserId() { return usedByUserId; }
    public void setUsedByUserId(Integer usedByUserId) { this.usedByUserId = usedByUserId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
