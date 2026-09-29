package com.ecommerce.dto;

/** Catégorie renvoyée par l'API, avec le nombre de produits associés. */
public record CategoryResponse(
        Long id,
        String nom,
        String description,
        long nombreProduits
) {
}
