
package com.civiguard.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.JoinColumn;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MultiLanguageText {
    
    @ElementCollection
    @CollectionTable(name = "translated_texts", 
                     joinColumns = @JoinColumn(name = "entity_id"))
    @Column(name = "text", length = 4000)
    private Map<String, String> translations = new HashMap<>();
    
    public String getTranslation(String languageCode) {
        return translations.getOrDefault(languageCode, translations.getOrDefault("en", ""));
    }
    
    public void addTranslation(String languageCode, String text) {
        translations.put(languageCode, text);
    }
}
