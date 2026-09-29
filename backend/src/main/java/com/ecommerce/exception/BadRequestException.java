package com.ecommerce.exception;

/** Requête refusée pour une règle métier : renvoyée en 400. */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
