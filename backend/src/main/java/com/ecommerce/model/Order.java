package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Commande passée par un utilisateur.
 * La table s'appelle "orders" car "order" est un mot réservé en SQL.
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "date_commande", nullable = false)
    private LocalDateTime dateCommande;

    /** Numéro annoncé au comptoir (ex. 3iL-0042). Attribué juste après l'insertion, à partir de l'id. */
    @Column(name = "numero_ticket", unique = true, length = 12)
    private String numeroTicket;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus statut;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    /** Lignes de la commande. Elles sont enregistrées/supprimées avec la commande. */
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    /** Ajoute une ligne en maintenant les deux côtés de la relation. */
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    @PrePersist
    void prePersist() {
        if (dateCommande == null) {
            dateCommande = LocalDateTime.now();
        }
        if (statut == null) {
            statut = OrderStatus.EN_ATTENTE;
        }
    }
}
