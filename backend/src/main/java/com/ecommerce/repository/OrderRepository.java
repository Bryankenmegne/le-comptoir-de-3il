package com.ecommerce.repository;

import com.ecommerce.model.Order;
import com.ecommerce.model.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    /** Commandes d'un utilisateur, les plus récentes d'abord (client et lignes chargés d'un coup). */
    @EntityGraph(attributePaths = {"user", "items"})
    List<Order> findByUserEmailOrderByDateCommandeDesc(String email);

    @EntityGraph(attributePaths = {"user", "items"})
    Optional<Order> findByIdAndUserEmail(Long id, String email);

    @EntityGraph(attributePaths = {"user", "items"})
    List<Order> findAllByOrderByDateCommandeDesc();

    /** Somme de toutes les commandes (null s'il n'y en a aucune). */
    @Query("SELECT SUM(o.total) FROM Order o")
    BigDecimal sumChiffreAffaires();

    long countByStatut(OrderStatus statut);
}
