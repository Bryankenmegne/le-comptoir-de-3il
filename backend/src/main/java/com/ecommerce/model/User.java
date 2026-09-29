package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Utilisateur de la boutique (client ou administrateur).
 * La table s'appelle "users" car "user" est un mot réservé en SQL.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /** Mot de passe hashé avec BCrypt (jamais stocké en clair). */
    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 100)
    private String nom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;
}
