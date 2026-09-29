package com.ecommerce.dto;

import java.math.BigDecimal;

/** Statistiques affichées sur le tableau de bord admin. */
public record DashboardStats(
        long nombreProduits,
        long nombreCategories,
        long nombreCommandes,
        long nombreClients,
        long commandesEnAttente,
        long produitsStockFaible,
        BigDecimal chiffreAffaires
) {
}
