package com.codequest.libralink.dto;

import com.codequest.libralink.entity.Book;
import java.util.List;

public class AiChatResponse {

    private String response;
    private String intent;
    private List<Book> suggestedBooks;

    public AiChatResponse() {}

    public AiChatResponse(String response, String intent, List<Book> suggestedBooks) {
        this.response = response;
        this.intent = intent;
        this.suggestedBooks = suggestedBooks;
    }

    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }

    public String getIntent() { return intent; }
    public void setIntent(String intent) { this.intent = intent; }

    public List<Book> getSuggestedBooks() { return suggestedBooks; }
    public void setSuggestedBooks(List<Book> suggestedBooks) { this.suggestedBooks = suggestedBooks; }
}
