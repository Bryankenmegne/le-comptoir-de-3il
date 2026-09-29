package com.ecommerce.repository;

import com.ecommerce.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /** Un produit déjà commandé ne peut pas être supprimé (historique des commandes). */
    boolean existsByProductId(Long productId);
}
