package com.ecommerce.repository;

import com.ecommerce.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByNomIgnoreCase(String nom);

    /** Utile en modification : une autre catégorie porte-t-elle déjà ce nom ? */
    boolean existsByNomIgnoreCaseAndIdNot(String nom, Long id);
}
