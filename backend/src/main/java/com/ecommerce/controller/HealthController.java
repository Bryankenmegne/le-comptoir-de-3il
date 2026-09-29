package com.ecommerce.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Route publique pour vérifier que l'API tourne
 * (utile pour l'hébergeur et pour "réveiller" le serveur).
 */
@RestController
public class HealthController {

    @GetMapping({"/", "/api/health"})
    public Map<String, String> health() {
        return Map.of("status", "UP", "application", "ecommerce-app");
    }
}
