package com.ecommerce.dto;

/** Informations publiques de l'utilisateur connecté (jamais le mot de passe). */
public record UserResponse(
        Long id,
        String email,
        String nom,
        String role
) {
}
