/**
 * cart.js
 * - Cart : panier stocké dans le localStorage
 * - Page panier (cart.html) : affichage, quantités, validation de la commande
 *
 * Le panier garde une copie du nom, du prix et du stock pour l'affichage,
 * mais ces valeurs sont rafraîchies depuis l'API à l'ouverture du panier
 * et le serveur recalcule toujours le total réel.
 */

const Cart = (() => {
    const KEY = CONFIG.STORAGE_KEYS.cart;
    const MAX_PER_LINE = 100; // même limite que le back-end

    function items() {
        try {
            const data = JSON.parse(localStorage.getItem(KEY));
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    function save(list) {
        localStorage.setItem(KEY, JSON.stringify(list));
        updateBadge();
    }

    function maxFor(stock) {
        return Math.max(0, Math.min(Number(stock) || 0, MAX_PER_LINE));
    }

    /**
     * Ajoute un produit. Renvoie la quantité réellement ajoutée
     * (elle peut être plafonnée par le stock).
     */
    function add(product, quantity = 1) {
        const list = items();
        const line = list.find((i) => i.productId === product.id);
        const max = maxFor(product.stock);
        const current = line ? line.quantite : 0;
        const next = Math.min(current + quantity, max);
        const added = next - current;
        if (added <= 0) return 0;

        if (line) {
            Object.assign(line, { quantite: next, prix: product.prix, stock: product.stock, nom: product.nom });
        } else {
            list.push({
                productId: product.id,
                nom: product.nom,
                prix: product.prix,
                imageUrl: product.imageUrl,
                stock: product.stock,
                quantite: next,
            });
        }
        save(list);
        return added;
    }

    function setQuantity(productId, quantity) {
        const list = items();
        const line = list.find((i) => i.productId === productId);
        if (!line) return;
        const qty = Math.max(1, Math.min(Math.floor(quantity) || 1, maxFor(line.stock)));
        line.quantite = qty;
        save(list);
    }

    function remove(productId) {
        save(items().filter((i) => i.productId !== productId));
    }

    function clear() {
        save([]);
    }

    function count() {
        return items().reduce((sum, i) => sum + i.quantite, 0);
    }

    function total() {
        return items().reduce((sum, i) => sum + Number(i.prix) * i.quantite, 0);
    }

    function updateBadge() {
        const badge = document.getElementById('cart-count');
        if (badge) {
            const n = count();
            badge.textContent = n;
            badge.setAttribute('aria-label', `${n} article${n > 1 ? 's' : ''}`);
        }
    }

    /**
     * Met à jour prix et stock depuis l'API.
     * Renvoie la liste des messages à afficher (produits retirés ou modifiés).
     */
    async function refresh() {
        const list = items();
        const notes = [];
        const results = await Promise.allSettled(list.map((i) => Api.get(`/products/${i.productId}`)));

        const updated = [];
        results.forEach((result, index) => {
            const line = list[index];
            if (result.status === 'rejected') {
                if (result.reason?.status === 404) {
                    notes.push(`« ${line.nom} » n'est plus disponible et a été retiré de votre commande.`);
                } else {
                    updated.push(line); // erreur réseau : on garde la ligne telle quelle
                }
                return;
            }
            const p = result.value;
            if (p.stock <= 0) {
                notes.push(`« ${p.nom} » est en rupture de stock et a été retiré de votre commande.`);
                return;
            }
            if (Number(p.prix) !== Number(line.prix)) {
                notes.push(`Le prix de « ${p.nom} » est passé à ${UI.formatPrice(p.prix)}.`);
            }
            let quantite = line.quantite;
            if (quantite > p.stock) {
                quantite = maxFor(p.stock);
                notes.push(`Quantité de « ${p.nom} » ramenée à ${quantite} (stock disponible).`);
            }
            updated.push({
                productId: p.id, nom: p.nom, prix: p.prix, imageUrl: p.imageUrl, stock: p.stock, quantite,
            });
        });

        save(updated);
        return notes;
    }

    return { items, add, setQuantity, remove, clear, count, total, updateBadge, refresh };
})();

/* ------------------------------------------------------------------ */
/* Page panier                                                         */
/* ------------------------------------------------------------------ */
const CartPage = (() => {
    let root;
    let alertBox;

    function lineHtml(item) {
        const subtotal = Number(item.prix) * item.quantite;
        return `
            <li class="cart-line" data-id="${item.productId}">
                <img class="cart-thumb" src="${UI.imageSrc(item.imageUrl)}" alt="" loading="lazy">
                <div class="cart-line-info">
                    <a class="cart-line-name" href="product.html?id=${item.productId}">${UI.escapeHtml(item.nom)}</a>
                    <span class="muted">${UI.formatPrice(item.prix)} l'unité</span>
                </div>
                <label class="qty-field">
                    <span class="sr-only">Quantité pour ${UI.escapeHtml(item.nom)}</span>
                    <input type="number" class="qty-input" min="1" max="${Math.min(item.stock, 100)}" value="${item.quantite}" inputmode="numeric">
                </label>
                <strong class="cart-line-total">${UI.formatPrice(subtotal)}</strong>
                <button type="button" class="btn btn-ghost btn-small remove-btn">Retirer</button>
            </li>`;
    }

    function render() {
        const list = Cart.items();

        if (list.length === 0) {
            root.innerHTML = `
                <div class="empty-state">
                    <h2>Votre commande est vide</h2>
                    <p>Parcourez le catalogue et ajoutez les produits qui vous intéressent.</p>
                    <a class="btn" href="index.html">Voir le catalogue</a>
                </div>`;
            return;
        }

        const loggedIn = Auth.isLoggedIn();
        root.innerHTML = `
            <div class="cart-layout">
                <ul class="cart-lines">${list.map(lineHtml).join('')}</ul>
                <aside class="cart-summary" aria-label="Récapitulatif">
                    <h2>Récapitulatif</h2>
                    <dl class="summary-list">
                        <div><dt>Articles</dt><dd>${Cart.count()}</dd></div>
                        <div><dt>Retrait</dt><dd>Au comptoir</dd></div>
                        <div class="summary-total"><dt>Total</dt><dd>${UI.formatPrice(Cart.total())}</dd></div>
                    </dl>
                    <button type="button" class="btn btn-block" id="checkout-btn">
                        ${loggedIn ? 'Commander et obtenir mon ticket' : 'Se connecter pour commander'}
                    </button>
                    <button type="button" class="btn btn-ghost btn-block" id="clear-btn">Vider ma commande</button>
                    <p class="muted small">Le total final est recalculé par le serveur avec les prix en vigueur.</p>
                </aside>
            </div>`;
    }

    function showConfirmation(order) {
        // Le panier est vidé avant l'affichage : les quantités viennent de la commande.
        const articles = order.items.reduce((total, item) => total + item.quantite, 0);
        root.innerHTML = `
            <div class="confirmation">
                <h2>Commande enregistrée</h2>
                <p>Merci ${UI.escapeHtml(order.clientNom)} ! Gardez ce numéro : il vous sera demandé
                   au comptoir pour retirer votre commande.</p>
                <div class="ticket">
                    <div class="ticket-head">
                        <span>Ticket de retrait</span>
                        <span>${UI.escapeHtml(UI.statusLabel(order.statut))}</span>
                    </div>
                    <strong class="ticket-number">${UI.escapeHtml(order.numeroTicket)}</strong>
                    <p class="ticket-hint">Le Comptoir de 3iL</p>
                    <div class="ticket-tear"></div>
                    <div class="ticket-foot">
                        <span>${articles} article${articles > 1 ? 's' : ''}</span>
                        <strong>${UI.formatPrice(order.total)}</strong>
                    </div>
                </div>
                <div class="button-row">
                    <a class="btn" href="orders.html?nouvelle=${order.id}">Voir mes tickets</a>
                    <a class="btn btn-secondary" href="index.html">Commander autre chose</a>
                </div>
            </div>`;
    }

    async function checkout(button) {
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html?redirect=cart.html';
            return;
        }
        const payload = {
            items: Cart.items().map((i) => ({ productId: i.productId, quantite: i.quantite })),
        };
        UI.showAlert(alertBox, '');
        try {
            const order = await UI.withBusy(button, 'Validation\u2026', () => Api.post('/orders', payload));
            Cart.clear();
            showConfirmation(order);
            UI.toast('Commande validée', 'success');
        } catch (error) {
            if (error.status === 401) {
                window.location.href = 'login.html?redirect=cart.html';
                return;
            }
            UI.showAlert(alertBox, error.message);
            // Le stock a pu changer : on rafraîchit le panier
            const notes = await Cart.refresh();
            render();
            if (notes.length) UI.showAlert(alertBox, `${error.message} ${notes.join(' ')}`);
        }
    }

    function bindEvents() {
        root.addEventListener('change', (event) => {
            if (!event.target.classList.contains('qty-input')) return;
            const id = Number(event.target.closest('.cart-line').dataset.id);
            Cart.setQuantity(id, Number(event.target.value));
            render();
            root.querySelector(`.cart-line[data-id="${id}"] .qty-input`)?.focus();
        });

        root.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('remove-btn')) {
                Cart.remove(Number(target.closest('.cart-line').dataset.id));
                render();
                UI.toast('Article retiré de votre commande');
            } else if (target.id === 'clear-btn') {
                if (confirm('Vider entièrement votre commande ?')) {
                    Cart.clear();
                    render();
                }
            } else if (target.id === 'checkout-btn') {
                checkout(target);
            }
        });
    }

    async function init() {
        root = document.getElementById('cart-root');
        if (!root) return;
        alertBox = document.getElementById('cart-alert');

        render();
        bindEvents();

        if (Cart.items().length) {
            try {
                const notes = await Cart.refresh();
                render();
                if (notes.length) UI.showAlert(alertBox, notes.join(' '), 'info');
            } catch (error) {
                UI.showAlert(alertBox, error.message);
            }
        }
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    Cart.updateBadge();
    CartPage.init();
});
