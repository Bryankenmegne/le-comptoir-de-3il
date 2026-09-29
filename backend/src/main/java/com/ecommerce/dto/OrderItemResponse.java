package com.ecommerce.dto;

import java.math.BigDecimal;

/** Ligne de commande renvoyée par l'API. */
public record OrderItemResponse(
        Long productId,
        String nomProduit,
        Integer quantite,
        BigDecimal prixUnitaire,
        BigDecimal sousTotal
) {
}
