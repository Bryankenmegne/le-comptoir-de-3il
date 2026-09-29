package com.ecommerce.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/** Création / modification d'un produit (admin). */
public record ProductRequest(
        @NotBlank(message = "Le nom du produit est obligatoire")
        @Size(max = 150, message = "Le nom ne doit pas dépasser 150 caractères")
        String nom,

        @Size(max = 2000, message = "La description ne doit pas dépasser 2000 caractères")
        String description,

        @NotNull(message = "Le prix est obligatoire")
        @DecimalMin(value = "0.01", message = "Le prix doit être supérieur à 0")
        @Digits(integer = 8, fraction = 2, message = "Le prix doit avoir au plus 2 décimales")
        BigDecimal prix,

        @NotNull(message = "Le stock est obligatoire")
        @Min(value = 0, message = "Le stock ne peut pas être négatif")
        Integer stock,

        @Size(max = 500, message = "L'URL de l'image ne doit pas dépasser 500 caractères")
        @Pattern(regexp = "^$|^https?://.+", message = "L'URL de l'image doit commencer par http:// ou https://")
        String imageUrl,

        @NotNull(message = "La catégorie est obligatoire")
        Long categoryId
) {
}
