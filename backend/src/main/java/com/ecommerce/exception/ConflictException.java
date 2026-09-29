package com.ecommerce.exception;

/** Conflit avec une donnée existante (ex : email déjà utilisé) : renvoyé en 409. */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
