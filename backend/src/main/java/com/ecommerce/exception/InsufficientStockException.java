package com.ecommerce.exception;

/** Stock insuffisant lors d'une commande : renvoyée en 400. */
public class InsufficientStockException extends BadRequestException {

    public InsufficientStockException(String nomProduit, int disponible, int demande) {
        super("Stock insuffisant pour \"" + nomProduit + "\" : " + disponible
                + " disponible(s), " + demande + " demandé(s)");
    }
}
