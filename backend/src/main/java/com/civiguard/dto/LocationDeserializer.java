package com.civiguard.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;

public class LocationDeserializer extends JsonDeserializer<ReportRequest.Location> {
    
    @Override
    public ReportRequest.Location deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);
        ReportRequest.Location location = new ReportRequest.Location();
        
        if (node.isTextual()) {
            // Handle string format (address only)
            location.setAddress(node.asText());
        } else if (node.isObject()) {
            // Handle object format with coordinates and address
            if (node.has("lat") && node.has("lng")) {
                location.setLat(node.get("lat").asDouble());
                location.setLng(node.get("lng").asDouble());
            }
            
            if (node.has("address")) {
                location.setAddress(node.get("address").asText());
            }
        }
        
        return location;
    }
}
