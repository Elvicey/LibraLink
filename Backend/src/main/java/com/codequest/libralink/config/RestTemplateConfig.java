package com.codequest.libralink.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Central RestTemplate bean for all outbound calls to third-party APIs (OpenAI, Google
 * TTS, Expo push). Previously each service constructed its own {@code new RestTemplate()}
 * with no timeout configured at all, so a hung/slow third-party API could tie up a
 * servlet thread - and, for calls made synchronously from write paths, a DB connection -
 * indefinitely (audit H2). Every caller should inject this bean instead of constructing
 * its own RestTemplate.
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate externalApiRestTemplate(
            @Value("${http.client.connect-timeout-ms:5000}") long connectTimeoutMs,
            @Value("${http.client.read-timeout-ms:20000}") long readTimeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        factory.setReadTimeout(Duration.ofMillis(readTimeoutMs));
        return new RestTemplate(factory);
    }
}
