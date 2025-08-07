
package com.civiguard.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LanguageService {
    
    @Value("${app.languages.supported}")
    private String supportedLanguages;
    
    private final Map<String, String> languageNames = new HashMap<>();
    
    public LanguageService() {
        // Initialize the language names
        languageNames.put("en", "English");
        languageNames.put("hi", "Hindi");
        languageNames.put("bn", "Bengali");
        languageNames.put("te", "Telugu");
        languageNames.put("ta", "Tamil");
        languageNames.put("mr", "Marathi");
        languageNames.put("gu", "Gujarati");
        languageNames.put("kn", "Kannada");
        languageNames.put("ml", "Malayalam");
        languageNames.put("pa", "Punjabi");
        languageNames.put("or", "Odia");
    }
    
    public List<String> getSupportedLanguageCodes() {
        return Arrays.asList(supportedLanguages.split(","));
    }
    
    public boolean isLanguageSupported(String languageCode) {
        return getSupportedLanguageCodes().contains(languageCode);
    }
    
    public String getLanguageName(String languageCode) {
        return languageNames.getOrDefault(languageCode, languageCode);
    }
    
    public Map<String, String> getAvailableLanguages() {
        Map<String, String> availableLanguages = new HashMap<>();
        
        for (String code : getSupportedLanguageCodes()) {
            availableLanguages.put(code, getLanguageName(code));
        }
        
        return availableLanguages;
    }
}
