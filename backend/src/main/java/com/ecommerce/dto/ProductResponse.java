package com.ecommerce.dto;

import java.math.BigDecimal;

/** Produit renvoyé par l'API. */
public record ProductResponse(
        Long id,
        String nom,
        String description,
        BigDecimal prix,
        Integer stock,
        String imageUrl,
        Long categoryId,
        String categoryNom
) {
}
