package com.ecommerce.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Création et lecture des tokens JWT.
 * Le secret et la durée de validité viennent de application.properties
 * (surchargeables par les variables d'environnement JWT_SECRET et JWT_EXPIRATION_MS).
 */
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(@Value("${app.jwt.secret}") String secret,
                   @Value("${app.jwt.expiration-ms}") long expirationMs) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        // HMAC-SHA exige une clé d'au moins 256 bits (32 octets)
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret doit contenir au moins 32 caractères");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirationMs = expirationMs;
    }

    /** Génère un token signé contenant l'email (subject) et le rôle. */
    public String generateToken(String email, String role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    /**
     * Vérifie la signature et l'expiration puis renvoie l'email.
     * Lève une JwtException si le token est invalide ou expiré.
     */
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
