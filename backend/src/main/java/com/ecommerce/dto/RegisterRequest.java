package com.ecommerce.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Corps de la requête POST /api/auth/register. */
public record RegisterRequest(
        @NotBlank(message = "Le nom est obligatoire")
        @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères")
        String nom,

        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "Format d'email invalide")
        @Size(max = 150, message = "L'email ne doit pas dépasser 150 caractères")
        String email,

        @NotBlank(message = "Le mot de passe est obligatoire")
        @Size(min = 6, max = 100, message = "Le mot de passe doit contenir entre 6 et 100 caractères")
        String password
) {
}
