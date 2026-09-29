package com.ecommerce.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Ligne envoyée par le front lors d'une commande.
 * Seuls l'identifiant et la quantité sont transmis : le prix est relu en base.
 */
public record OrderItemRequest(
        @NotNull(message = "L'identifiant du produit est obligatoire")
        Long productId,

        @NotNull(message = "La quantité est obligatoire")
        @Min(value = 1, message = "La quantité doit être au moins 1")
        @Max(value = 100, message = "La quantité ne peut pas dépasser 100")
        Integer quantite
) {
}
