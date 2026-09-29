package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Ligne d'une commande.
 * Le prix unitaire et le nom du produit sont copiés au moment de l'achat :
 * si le produit change de prix plus tard, l'historique reste juste.
 */
@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "nom_produit", nullable = false, length = 150)
    private String nomProduit;

    @Column(nullable = false)
    private Integer quantite;

    @Column(name = "prix_unitaire", nullable = false, precision = 10, scale = 2)
    private BigDecimal prixUnitaire;

    /** Sous-total calculé (non stocké en base). */
    public BigDecimal getSousTotal() {
        return prixUnitaire.multiply(BigDecimal.valueOf(quantite));
    }
}
