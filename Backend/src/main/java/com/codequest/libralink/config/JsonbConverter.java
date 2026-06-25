package com.codequest.libralink.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class JsonbConverter implements AttributeConverter<String, String> {
    @Override
    public String convertToDatabaseColumn(String meta) {
        return meta; // Stored directly as valid JSON String
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return dbData;
    }
}
