package com.civiguard.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private int jwtExpirationInMs;

    @Value("${app.jwt.refresh.expiration}")
    private int jwtRefreshExpirationInMs; // New property for refresh token expiration

    // Change injected type to CustomUserDetailsService
    private final CustomUserDetailsService customUserDetailsService;

    public JwtTokenProvider(CustomUserDetailsService customUserDetailsService) {
        this.customUserDetailsService = customUserDetailsService;
    }

    // Generate both access and refresh tokens
    public Map<String, String> generateTokens(Authentication authentication) {
        UserPrincipal userPrincipal;
        try {
            userPrincipal = (UserPrincipal) authentication.getPrincipal();
        } catch (ClassCastException e) {
            log.error("Invalid principal type: expected UserPrincipal, got {}", authentication.getPrincipal().getClass());
            throw new IllegalArgumentException("Authentication principal must be of type UserPrincipal", e);
        }

        Date now = new Date();
        Date accessExpiryDate = new Date(now.getTime() + jwtExpirationInMs);
        Date refreshExpiryDate = new Date(now.getTime() + jwtRefreshExpirationInMs);

        String authorities = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        // Generate access token
        String accessToken = Jwts.builder()
                .setSubject(Long.toString(userPrincipal.getId()))
                .claim("username", userPrincipal.getUsername())
                .claim("authorities", authorities)
                .setIssuedAt(now)
                .setExpiration(accessExpiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();

        // Generate refresh token
        String refreshToken = Jwts.builder()
                .setSubject(Long.toString(userPrincipal.getId()))
                .setIssuedAt(now)
                .setExpiration(refreshExpiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();

        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);
        tokens.put("expiresIn", String.valueOf(jwtExpirationInMs / 1000)); // In seconds
        return tokens;
    }

    // Refresh the access token using the refresh token
    public Map<String, String> refreshToken(String refreshToken) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(refreshToken)
                    .getBody();

            Long userId = Long.parseLong(claims.getSubject());
            UserPrincipal userPrincipal = (UserPrincipal) customUserDetailsService.loadUserById(userId);

            Date now = new Date();
            Date accessExpiryDate = new Date(now.getTime() + jwtExpirationInMs);

            String authorities = userPrincipal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.joining(","));

            String newAccessToken = Jwts.builder()
                    .setSubject(Long.toString(userPrincipal.getId()))
                    .claim("username", userPrincipal.getUsername())
                    .claim("authorities", authorities)
                    .setIssuedAt(now)
                    .setExpiration(accessExpiryDate)
                    .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                    .compact();

            Map<String, String> tokens = new HashMap<>();
            tokens.put("accessToken", newAccessToken);
            tokens.put("expiresIn", String.valueOf(jwtExpirationInMs / 1000));
            return tokens;
        } catch (ExpiredJwtException ex) {
            log.error("Refresh token expired: {}", ex.getMessage());
            throw new SecurityException("Refresh token has expired", ex);
        } catch (Exception ex) {
            log.error("Invalid refresh token: {}", ex.getMessage());
            throw new SecurityException("Invalid refresh token", ex);
        }
    }

    public Long getUserIdFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return Long.parseLong(claims.getSubject());
    }

    public Authentication getAuthentication(String token) {
        Long userId = getUserIdFromJWT(token);
        UserPrincipal userPrincipal;
        try {
            userPrincipal = (UserPrincipal) customUserDetailsService.loadUserById(userId);
        } catch (ClassCastException e) {
            log.error("Invalid user principal type for userId {}: {}", userId, e.getMessage());
            throw new IllegalArgumentException("User principal must be of type UserPrincipal", e);
        }
        return new UsernamePasswordAuthenticationToken(userPrincipal, token, userPrincipal.getAuthorities());
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .setAllowedClockSkewSeconds(60) // Allow 60 seconds of clock skew
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (SignatureException ex) {
            log.error("Invalid JWT signature: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty: {}", ex.getMessage());
        }
        return false;
    }

    // New method to get detailed validation result
    public ValidationResult validateTokenWithDetails(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .setAllowedClockSkewSeconds(60)
                    .build()
                    .parseClaimsJws(authToken);
            return new ValidationResult(true, "Token is valid");
        } catch (SignatureException ex) {
            log.error("Invalid JWT signature: {}", ex.getMessage());
            return new ValidationResult(false, "Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token: {}", ex.getMessage());
            return new ValidationResult(false, "Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token: {}", ex.getMessage());
            return new ValidationResult(false, "Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token: {}", ex.getMessage());
            return new ValidationResult(false, "Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty: {}", ex.getMessage());
            return new ValidationResult(false, "JWT claims string is empty");
        }
    }

    public String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private Key getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 64) {
            log.warn("JWT secret is too short for HS512. Minimum length is 64 bytes, got {} bytes. Padding key...", keyBytes.length);
            // Pad the key if it's too short
            byte[] paddedKey = new byte[64];
            System.arraycopy(keyBytes, 0, paddedKey, 0, keyBytes.length);
            return Keys.hmacShaKeyFor(paddedKey);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Inner class to hold validation result
    public static class ValidationResult {
        private final boolean valid;
        private final String message;

        public ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }
}