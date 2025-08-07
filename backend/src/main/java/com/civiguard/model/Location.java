
package com.civiguard.model;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Location {
    private Double latitude;
    private Double longitude;
    private String address;
    private String district;
    private String city;
    private String state;
    private String postalCode;
    private String country = "India";

    @Override
    public String toString() {
        return String.format("%s, %s, %s, %s", 
            address != null ? address : "",
            city != null ? city : "",
            state != null ? state : "India",
            postalCode != null ? postalCode : ""
        ).trim().replaceAll(",\\s*,", ",").replaceAll("^,\\s*|\\s*,$", "");
    }
}
