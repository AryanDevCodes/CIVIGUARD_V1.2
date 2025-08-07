package com.civiguard.service;

import com.civiguard.dto.auth.JwtAuthResponse;
import com.civiguard.dto.auth.LoginRequest;
import com.civiguard.dto.auth.RegisterRequest;

public interface AuthService {
    JwtAuthResponse registerUser(RegisterRequest request);
    JwtAuthResponse authenticateUser(LoginRequest request);
}
