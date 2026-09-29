package com.ecommerce.model;

/**
 * Rôles possibles d'un utilisateur.
 * Spring Security les utilise avec le préfixe "ROLE_" (ROLE_USER, ROLE_ADMIN).
 */
public enum Role {
    USER,
    ADMIN
}
