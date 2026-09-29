package com.ecommerce.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Mise à jour rapide du stock d'un produit (admin). */
public record StockUpdateRequest(
        @NotNull(message = "Le stock est obligatoire")
        @Min(value = 0, message = "Le stock ne peut pas être négatif")
        Integer stock
) {
}
