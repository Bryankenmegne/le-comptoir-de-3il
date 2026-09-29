package com.ecommerce.service;

import com.ecommerce.dto.*;
import com.ecommerce.exception.ConflictException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Role;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Inscription, connexion et informations de l'utilisateur connecté.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    /** Crée un compte client (rôle USER uniquement) et renvoie directement un token. */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Un compte existe déjà avec cet email");
        }

        User user = User.builder()
                .email(email)
                .nom(request.nom().trim())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER) // on ne laisse jamais le front choisir son rôle
                .build();

        return toAuthResponse(userRepository.save(user));
    }

    /**
     * Vérifie email + mot de passe via Spring Security.
     * En cas d'échec, une BadCredentialsException est levée (renvoyée en 401).
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        return new UserResponse(user.getId(), user.getEmail(), user.getNom(), user.getRole().name());
    }

    private AuthResponse toAuthResponse(User user) {
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, jwtUtil.getExpirationMs(), user.getId(),
                user.getEmail(), user.getNom(), user.getRole().name());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
