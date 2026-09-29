package com.ecommerce.dto;

/** Réponse renvoyée après une connexion ou une inscription réussie. */
public record AuthResponse(
        String token,
        long expiresIn,
        Long id,
        String email,
        String nom,
        String role
) {
}
