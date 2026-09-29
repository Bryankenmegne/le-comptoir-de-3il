package com.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Création / modification d'une catégorie (admin). */
public record CategoryRequest(
        @NotBlank(message = "Le nom de la catégorie est obligatoire")
        @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères")
        String nom,

        @Size(max = 500, message = "La description ne doit pas dépasser 500 caractères")
        String description
) {
}
