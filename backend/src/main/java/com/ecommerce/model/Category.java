package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Catégorie de produits (ex : Électronique, Livres...).
 */
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String nom;

    @Column(length = 500)
    private String description;
}
