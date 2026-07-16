package com.codequest.libralink.dto;

public class AuthResponse {

    private String token;
    private Integer userId;
    private String email;
    private String firstName;
    private String lastName;

    public AuthResponse(String token, Integer userId, String email, String firstName, String lastName) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getToken() { return token; }
    public Integer getUserId() { return userId; }
    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
}
