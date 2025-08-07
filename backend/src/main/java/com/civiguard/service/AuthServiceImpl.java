package com.civiguard.service;

import com.civiguard.dto.auth.JwtAuthResponse;
import com.civiguard.dto.auth.LoginRequest;
import com.civiguard.dto.auth.RegisterRequest;
import com.civiguard.exception.ResourceAlreadyExistsException;
import com.civiguard.model.User;
import com.civiguard.repository.UserRepository;
import com.civiguard.security.JwtTokenProvider;
import com.civiguard.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    public JwtAuthResponse registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("Email is already taken");
        }
        if (userRepository.existsByAadhaar(request.getAadhaar())) {
            throw new ResourceAlreadyExistsException("Aadhaar is already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAadhaar(request.getAadhaar());
        user.setActive(true);
        user.setLastLogin(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        // Use the new generateTokens method and extract accessToken
        Map<String, String> tokens = tokenProvider.generateTokens(authentication);
        String jwt = tokens.get("accessToken");
        
        return new JwtAuthResponse(jwt, savedUser.getId(), savedUser.getEmail(), 
            savedUser.getName(), savedUser.getRole().name());
    }
    
    public JwtAuthResponse authenticateUser(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        // Use the new generateTokens method and extract accessToken
        Map<String, String> tokens = tokenProvider.generateTokens(authentication);
        String jwt = tokens.get("accessToken");
        
        UserPrincipal userDetails = (UserPrincipal) authentication.getPrincipal();
        
        // Update last login time
        userRepository.findById(userDetails.getId())
            .ifPresent(user -> {
                user.setLastLogin(LocalDateTime.now());
                userRepository.save(user);
            });
        
        return new JwtAuthResponse(jwt, userDetails.getId(), userDetails.getEmail(), 
            userDetails.getName(), userDetails.getAuthorities().iterator().next().getAuthority());
    }
}
