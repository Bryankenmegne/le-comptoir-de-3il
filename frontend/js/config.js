/**
 * Configuration du front-end.
 *
 * API_BASE_URL est l'adresse de l'API Spring Boot :
 * - en local (localhost / 127.0.0.1) : http://localhost:8080/api
 * - en ligne (Vercel) : la valeur de PROD_API_URL
 *
 * Après avoir déployé le back-end, remplacez PROD_API_URL par son adresse.
 */
const PROD_API_URL = 'https://VOTRE-API.onrender.com/api';

const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const CONFIG = Object.freeze({
    API_BASE_URL: IS_LOCAL ? 'http://localhost:8080/api' : PROD_API_URL,
    STORAGE_KEYS: Object.freeze({
        token: 'ecommerce_token',
        user: 'ecommerce_user',
        cart: 'ecommerce_cart',
    }),
    LOW_STOCK_THRESHOLD: 5,
});
