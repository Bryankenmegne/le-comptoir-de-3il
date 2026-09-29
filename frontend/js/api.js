/**
 * api.js
 * - UI : petites fonctions d'affichage partagées (prix, dates, messages...)
 * - Api : client HTTP qui ajoute le token JWT et gère les erreurs de l'API
 */

/* ------------------------------------------------------------------ */
/* Utilitaires d'affichage                                             */
/* ------------------------------------------------------------------ */
const UI = (() => {
    const priceFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
    const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

    const STATUS_LABELS = {
        EN_ATTENTE: 'Commande reçue',
        EN_PREPARATION: 'En préparation',
        PRETE: 'Prête à retirer',
        RETIREE: 'Retirée',
    };

    /** Image affichée quand l'URL d'un produit est absente ou cassée. */
    const PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
        '<rect width="400" height="300" fill="#E8EEF1"/>' +
        '<rect x="150" y="95" width="100" height="80" rx="8" fill="none" stroke="#9AA0AB" stroke-width="6"/>' +
        '<circle cx="178" cy="122" r="9" fill="#9AA0AB"/>' +
        '<path d="M156 168l30-30 20 20 14-14 24 24" fill="none" stroke="#9AA0AB" stroke-width="6" stroke-linejoin="round"/>' +
        '<text x="200" y="215" font-family="sans-serif" font-size="16" fill="#6B7280" text-anchor="middle">Image indisponible</text>' +
        '</svg>'
    );

    function formatPrice(value) {
        return priceFormatter.format(Number(value) || 0);
    }

    function formatDate(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return Number.isNaN(date.getTime()) ? isoString : dateFormatter.format(date);
    }

    /** Échappe le texte avant de l'insérer dans du HTML (protection XSS). */
    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function imageSrc(url) {
        return url ? escapeHtml(url) : PLACEHOLDER_IMAGE;
    }

    function statusLabel(status) {
        return STATUS_LABELS[status] || status;
    }

    function statusBadge(status) {
        return `<span class="badge badge-${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span>`;
    }

    /** Texte + classe CSS décrivant le stock d'un produit. */
    function stockInfo(stock) {
        if (stock <= 0) return { text: 'Rupture de stock', css: 'stock-out' };
        if (stock < CONFIG.LOW_STOCK_THRESHOLD) return { text: `Plus que ${stock} en stock`, css: 'stock-low' };
        return { text: 'En stock', css: 'stock-ok' };
    }

    function getParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    /** Message temporaire en bas de l'écran. type : 'success' | 'error' | 'info' */
    let toastTimer;
    function toast(message, type = 'info') {
        let el = document.getElementById('toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'toast';
            el.className = 'toast';
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            document.body.appendChild(el);
        }
        el.textContent = message;
        el.dataset.type = type;
        el.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3500);
    }

    /** Bloc d'alerte dans la page (erreur de formulaire, confirmation...). */
    function showAlert(container, message, type = 'error') {
        if (!container) return;
        container.innerHTML = message
            ? `<div class="alert alert-${type}" role="alert">${escapeHtml(message)}</div>`
            : '';
    }

    /** Affiche les erreurs de validation renvoyées par l'API sous chaque champ. */
    function showFieldErrors(form, details) {
        form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });
        form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
        if (!details) return;
        Object.entries(details).forEach(([field, message]) => {
            const input = form.querySelector(`[name="${field}"]`);
            const slot = form.querySelector(`.field-error[data-for="${field}"]`);
            if (input) input.setAttribute('aria-invalid', 'true');
            if (slot) slot.textContent = message;
        });
    }

    /** Désactive un bouton pendant une requête pour éviter les doubles clics. */
    async function withBusy(button, busyText, action) {
        const original = button.textContent;
        button.disabled = true;
        button.textContent = busyText;
        try {
            return await action();
        } finally {
            button.disabled = false;
            button.textContent = original;
        }
    }

    /** Bandeau affiché si l'API met du temps à répondre (serveur gratuit en veille). */
    function showWakeNotice() {
        if (document.getElementById('wake-notice')) return;
        const el = document.createElement('div');
        el.id = 'wake-notice';
        el.className = 'wake-notice';
        el.setAttribute('role', 'status');
        el.textContent = 'Le serveur démarre, cela peut prendre jusqu\u2019à une minute la première fois\u2026';
        document.body.appendChild(el);
    }

    function hideWakeNotice() {
        document.getElementById('wake-notice')?.remove();
    }

    // Remplace toute image cassée par l'image de secours
    document.addEventListener('error', (event) => {
        const img = event.target;
        if (img instanceof HTMLImageElement && !img.dataset.fallback) {
            img.dataset.fallback = 'true';
            img.src = PLACEHOLDER_IMAGE;
        }
    }, true);

    return {
        STATUS_LABELS, PLACEHOLDER_IMAGE,
        formatPrice, formatDate, escapeHtml, imageSrc, statusLabel, statusBadge, stockInfo,
        getParam, toast, showAlert, showFieldErrors, withBusy, showWakeNotice, hideWakeNotice,
    };
})();

/* ------------------------------------------------------------------ */
/* Client de l'API REST                                                */
/* ------------------------------------------------------------------ */

/** Erreur renvoyée par l'API : message lisible + code HTTP + détails de validation. */
class ApiError extends Error {
    constructor(message, status, details) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details || null;
    }
}

const Api = (() => {
    const BASE_URL = CONFIG.API_BASE_URL.replace(/\/+$/, '');
    let pending = 0;
    let wakeTimer;

    async function request(method, path, body) {
        const headers = { Accept: 'application/json' };
        if (body !== undefined) headers['Content-Type'] = 'application/json';

        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.token);
        if (token) headers.Authorization = `Bearer ${token}`;

        // Au-delà de 5 s sans réponse, on prévient l'utilisateur
        pending += 1;
        if (pending === 1) wakeTimer = setTimeout(UI.showWakeNotice, 5000);

        let response;
        try {
            response = await fetch(BASE_URL + path, {
                method,
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
            });
        } catch (networkError) {
            throw new ApiError(
                'Impossible de joindre le serveur. Vérifiez que l\u2019API est démarrée et que son adresse est correcte dans js/config.js.',
                0
            );
        } finally {
            pending -= 1;
            if (pending === 0) {
                clearTimeout(wakeTimer);
                UI.hideWakeNotice();
            }
        }

        if (response.status === 204) return null;

        const text = await response.text();
        let data = null;
        if (text) {
            try { data = JSON.parse(text); } catch { data = null; }
        }

        if (!response.ok) {
            // Token expiré ou invalide : on déconnecte proprement
            if (response.status === 401 && token && typeof Auth !== 'undefined') {
                Auth.clearSession();
                throw new ApiError('Votre session a expiré. Reconnectez-vous.', 401);
            }
            const message = (data && data.message) || `Erreur ${response.status}`;
            throw new ApiError(message, response.status, data && data.details);
        }
        return data;
    }

    return {
        get: (path) => request('GET', path),
        post: (path, body) => request('POST', path, body ?? {}),
        put: (path, body) => request('PUT', path, body ?? {}),
        patch: (path, body) => request('PATCH', path, body ?? {}),
        delete: (path) => request('DELETE', path),
    };
})();
