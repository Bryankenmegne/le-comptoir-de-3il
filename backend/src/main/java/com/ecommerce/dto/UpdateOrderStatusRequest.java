package com.ecommerce.dto;

import com.ecommerce.model.OrderStatus;
import jakarta.validation.constraints.NotNull;

/** Changement de statut d'une commande (admin). */
public record UpdateOrderStatusRequest(
        @NotNull(message = "Le statut est obligatoire")
        OrderStatus statut
) {
}
