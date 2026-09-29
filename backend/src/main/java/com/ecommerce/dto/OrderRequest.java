package com.ecommerce.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Corps de la requête POST /api/orders. */
public record OrderRequest(
        @NotEmpty(message = "La commande doit contenir au moins un produit")
        @Size(max = 50, message = "Une commande ne peut pas contenir plus de 50 lignes")
        List<@Valid OrderItemRequest> items
) {
}
