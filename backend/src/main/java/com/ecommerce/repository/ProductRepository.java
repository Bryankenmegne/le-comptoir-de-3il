package com.ecommerce.repository;

import com.ecommerce.model.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Recherche avec filtres optionnels.
     * - categoryId null : toutes les catégories
     * - search vide     : tous les noms
     * La catégorie est chargée dans la même requête (JOIN FETCH) pour éviter le problème N+1.
     */
    @Query("""
            SELECT p FROM Product p
            JOIN FETCH p.category c
            WHERE (:categoryId IS NULL OR c.id = :categoryId)
              AND LOWER(p.nom) LIKE LOWER(CONCAT('%', :search, '%'))
            ORDER BY p.id
            """)
    List<Product> search(@Param("categoryId") Long categoryId, @Param("search") String search);

    /**
     * Charge un produit en le verrouillant pendant la transaction :
     * deux commandes simultanées ne peuvent pas vendre le même stock.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    long countByCategoryId(Long categoryId);

    boolean existsByCategoryId(Long categoryId);

    long countByStockLessThan(int seuil);
}
