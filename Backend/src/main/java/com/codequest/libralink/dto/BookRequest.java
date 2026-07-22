package com.codequest.libralink.dto;

import java.util.List;

public class BookRequest {

    private String title;
    private String subtitle;
    private String isbn;
    private String isbn13;
    private Integer institutionId;
    private Integer publisherId;
    private Integer categoryId;
    private Short publicationYear;
    private String edition;
    private String language;
    private String description;
    private String coverImageUrl;
    private String digitalUrl;
    private Integer totalCopies;
    private Integer availableCopies;
    private String locationCode;
    private String deweyDecimal;
    private boolean isDigitalOnly;
    private boolean isActive = true;
    private List<Integer> authorIds;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }

    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }

    public String getIsbn13() { return isbn13; }
    public void setIsbn13(String isbn13) { this.isbn13 = isbn13; }

    public Integer getInstitutionId() { return institutionId; }
    public void setInstitutionId(Integer institutionId) { this.institutionId = institutionId; }

    public Integer getPublisherId() { return publisherId; }
    public void setPublisherId(Integer publisherId) { this.publisherId = publisherId; }

    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }

    public Short getPublicationYear() { return publicationYear; }
    public void setPublicationYear(Short publicationYear) { this.publicationYear = publicationYear; }

    public String getEdition() { return edition; }
    public void setEdition(String edition) { this.edition = edition; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }

    public String getDigitalUrl() { return digitalUrl; }
    public void setDigitalUrl(String digitalUrl) { this.digitalUrl = digitalUrl; }

    public Integer getTotalCopies() { return totalCopies; }
    public void setTotalCopies(Integer totalCopies) { this.totalCopies = totalCopies; }

    public Integer getAvailableCopies() { return availableCopies; }
    public void setAvailableCopies(Integer availableCopies) { this.availableCopies = availableCopies; }

    public String getLocationCode() { return locationCode; }
    public void setLocationCode(String locationCode) { this.locationCode = locationCode; }

    public String getDeweyDecimal() { return deweyDecimal; }
    public void setDeweyDecimal(String deweyDecimal) { this.deweyDecimal = deweyDecimal; }

    public boolean isDigitalOnly() { return isDigitalOnly; }
    public void setDigitalOnly(boolean digitalOnly) { isDigitalOnly = digitalOnly; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public List<Integer> getAuthorIds() { return authorIds; }
    public void setAuthorIds(List<Integer> authorIds) { this.authorIds = authorIds; }
}
