package com.codequest.libralink.dto;

public class AiChatRequest {

    private String prompt;
    private Integer userId;

    public AiChatRequest() {}

    public AiChatRequest(String prompt, Integer userId) {
        this.prompt = prompt;
        this.userId = userId;
    }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
}
