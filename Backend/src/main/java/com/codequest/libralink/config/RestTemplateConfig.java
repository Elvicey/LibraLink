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

    /**
     * Separate, longer-timeout RestTemplate for Gemini TTS specifically. A book with even
     * a few hundred characters of real content (as opposed to a one-line blurb) can take
     * Gemini's TTS model well past the 20s default read timeout to synthesize, which was
     * surfacing as a spurious "Read timed out" failure on longer books. Safe to run much
     * longer than the shared default: AudioTrackService.processConversion runs this call
     * inside an @Async method with no transaction/DB connection held open across it.
     */
    @Bean
    public RestTemplate ttsApiRestTemplate(
            @Value("${http.client.connect-timeout-ms:5000}") long connectTimeoutMs,
            @Value("${http.client.tts-read-timeout-ms:90000}") long readTimeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        factory.setReadTimeout(Duration.ofMillis(readTimeoutMs));
        return new RestTemplate(factory);
    }
}
