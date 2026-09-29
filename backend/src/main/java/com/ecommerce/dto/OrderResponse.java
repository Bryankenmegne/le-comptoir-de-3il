package com.ecommerce.dto;

import com.ecommerce.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Commande renvoyée par l'API. */
public record OrderResponse(
        Long id,
        String numeroTicket,
        LocalDateTime dateCommande,
        OrderStatus statut,
        BigDecimal total,
        String clientEmail,
        String clientNom,
        List<OrderItemResponse> items
) {
}
