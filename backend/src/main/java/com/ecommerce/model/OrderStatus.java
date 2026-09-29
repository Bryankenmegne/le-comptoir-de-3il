package com.ecommerce.model;

/**
 * Cycle de vie d'une commande au comptoir : l'étudiant commande, la commande
 * est préparée, puis retirée sur présentation du numéro de ticket.
 */
public enum OrderStatus {
    EN_ATTENTE,
    EN_PREPARATION,
    PRETE,
    RETIREE
}
