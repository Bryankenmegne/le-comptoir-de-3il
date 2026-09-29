/**
 * auth.js
 * - Auth : session (token JWT + utilisateur) stockée dans le localStorage
 * - Layout : en-tête et pied de page communs aux pages publiques
 * - Formulaires de connexion et d'inscription
 */

const Auth = (() => {
    const KEYS = CONFIG.STORAGE_KEYS;

    /** Lit la date d'expiration contenue dans le token (sans vérifier la signature : le serveur s'en charge). */
    function tokenExpiry(token) {
        try {
            const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = JSON.parse(atob(payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=')));
            return json.exp ? json.exp * 1000 : 0;
        } catch {
            return 0;
        }
    }

    function getToken() {
        const token = localStorage.getItem(KEYS.token);
        if (!token) return null;
        if (tokenExpiry(token) <= Date.now()) {
            clearSession();
            return null;
        }
        return token;
    }

    function getUser() {
        if (!getToken()) return null;
        try {
            return JSON.parse(localStorage.getItem(KEYS.user));
        } catch {
            return null;
        }
    }

    function isLoggedIn() {
        return getUser() !== null;
    }

    function isAdmin() {
        return getUser()?.role === 'ADMIN';
    }

    function saveSession(authResponse) {
        localStorage.setItem(KEYS.token, authResponse.token);
        localStorage.setItem(KEYS.user, JSON.stringify({
            id: authResponse.id,
            email: authResponse.email,
            nom: authResponse.nom,
            role: authResponse.role,
        }));
    }

    function clearSession() {
        localStorage.removeItem(KEYS.token);
        localStorage.removeItem(KEYS.user);
    }

    function logout() {
        clearSession();
        window.location.href = Layout.root() + 'index.html';
    }

    /** Redirige vers la connexion si besoin, puis revient sur la page actuelle. */
    function requireLogin() {
        if (isLoggedIn()) return true;
        const page = window.location.pathname.split('/').pop() || 'index.html';
        const back = encodeURIComponent(page + window.location.search);
        window.location.replace(`${Layout.root()}login.html?redirect=${back}`);
        return false;
    }

    function requireAdmin() {
        if (isAdmin()) return true;
        window.location.replace(`${Layout.root()}login.html?redirect=${encodeURIComponent('admin/dashboard.html')}&admin=1`);
        return false;
    }

    return { getToken, getUser, isLoggedIn, isAdmin, saveSession, clearSession, logout, requireLogin, requireAdmin };
})();

/* ------------------------------------------------------------------ */
/* En-tête et pied de page                                             */
/* ------------------------------------------------------------------ */
const Layout = (() => {
    /** Préfixe des liens : "" à la racine, "../" dans /admin (défini par data-root sur <body>). */
    function root() {
        return document.body?.dataset.root || '';
    }

    function currentPage() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }

    function navLink(href, label) {
        const page = href.split('/').pop();
        const current = currentPage() === page || (page === 'index.html' && currentPage() === 'product.html');
        return `<a href="${root()}${href}"${current ? ' aria-current="page"' : ''}>${label}</a>`;
    }

    function renderHeader() {
        const header = document.getElementById('site-header');
        if (!header) return;
        const user = Auth.getUser();

        header.innerHTML = `
            <div class="container header-inner">
                <a class="brand" href="${root()}index.html">Le Comptoir de 3iL</a>
                <nav class="main-nav" aria-label="Navigation principale">
                    ${navLink('index.html', 'La carte')}
                    ${user ? navLink('orders.html', 'Mes tickets') : ''}
                    ${user?.role === 'ADMIN' ? navLink('admin/dashboard.html', 'Administration') : ''}
                </nav>
                <div class="header-actions">
                    <a class="cart-link" href="${root()}cart.html"${currentPage() === 'cart.html' ? ' aria-current="page"' : ''}>
                        Ma commande <span class="cart-count" id="cart-count" aria-label="articles">0</span>
                    </a>
                    ${user
                        ? `<span class="user-name" title="${UI.escapeHtml(user.email)}">${UI.escapeHtml(user.nom)}</span>
                           <button type="button" class="btn btn-ghost btn-small" id="logout-btn">Déconnexion</button>`
                        : `<a class="btn btn-small" href="${root()}login.html">Connexion</a>`}
                </div>
            </div>`;

        document.getElementById('logout-btn')?.addEventListener('click', Auth.logout);
        if (typeof Cart !== 'undefined') Cart.updateBadge();
    }

    function renderFooter() {
        const footer = document.getElementById('site-footer');
        if (!footer) return;
        footer.innerHTML = `
            <div class="container footer-inner">
                <p>Le Comptoir de 3iL, projet étudiant Spring Boot et JavaScript.</p>
                <p>Paiement fictif : réglez au comptoir en retirant votre commande.</p>
            </div>`;
    }

    return { root, renderHeader, renderFooter };
})();

/* ------------------------------------------------------------------ */
/* Formulaires de connexion / inscription                              */
/* ------------------------------------------------------------------ */

/** N'accepte qu'une redirection vers une page locale du site (évite les redirections malveillantes). */
function safeRedirect(target, fallback) {
    if (target && /^[a-z0-9_\-/]+\.html(\?[\w=&%.\-]*)?$/i.test(target) && !target.startsWith('/')) {
        return target;
    }
    return fallback;
}

function initLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;
    const alertBox = document.getElementById('form-alert');

    if (UI.getParam('admin')) {
        UI.showAlert(alertBox, 'Connectez-vous avec un compte administrateur pour accéder à cette page.', 'info');
    }
    // Conserve la redirection si l'utilisateur choisit de créer un compte
    const redirect = UI.getParam('redirect');
    const registerLink = document.getElementById('register-link');
    if (registerLink && redirect) {
        registerLink.href = `register.html?redirect=${encodeURIComponent(redirect)}`;
    }

    if (Auth.isLoggedIn() && !UI.getParam('admin')) {
        window.location.replace('index.html');
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        const payload = {
            email: form.email.value.trim(),
            password: form.password.value,
        };
        UI.showAlert(alertBox, '');
        UI.showFieldErrors(form, null);

        try {
            const auth = await UI.withBusy(button, 'Connexion\u2026', () => Api.post('/auth/login', payload));
            Auth.saveSession(auth);
            const fallback = auth.role === 'ADMIN' ? 'admin/dashboard.html' : 'index.html';
            window.location.href = safeRedirect(UI.getParam('redirect'), fallback);
        } catch (error) {
            UI.showFieldErrors(form, error.details);
            UI.showAlert(alertBox, error.message);
        }
    });
}

function initRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;
    const alertBox = document.getElementById('form-alert');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        UI.showAlert(alertBox, '');
        UI.showFieldErrors(form, null);

        if (form.password.value !== form.confirm.value) {
            UI.showFieldErrors(form, { confirm: 'Les deux mots de passe ne correspondent pas' });
            form.confirm.focus();
            return;
        }

        const payload = {
            nom: form.nom.value.trim(),
            email: form.email.value.trim(),
            password: form.password.value,
        };

        try {
            const auth = await UI.withBusy(button, 'Création du compte\u2026', () => Api.post('/auth/register', payload));
            Auth.saveSession(auth);
            UI.toast('Compte créé, bienvenue !', 'success');
            window.location.href = safeRedirect(UI.getParam('redirect'), 'index.html');
        } catch (error) {
            UI.showFieldErrors(form, error.details);
            UI.showAlert(alertBox, error.message);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    Layout.renderHeader();
    Layout.renderFooter();
    initLoginForm();
    initRegisterForm();
});
