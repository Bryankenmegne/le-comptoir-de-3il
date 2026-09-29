package com.ecommerce.exception;

/** Ressource introuvable : renvoyée en 404. */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String ressource, Long id) {
        super(ressource + " introuvable (id " + id + ")");
    }
}
