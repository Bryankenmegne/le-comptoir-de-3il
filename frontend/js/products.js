/**
 * products.js
 * - Page d'accueil (index.html) : catalogue, filtre par catégorie, recherche
 * - Page produit (product.html) : détail et ajout au panier
 */

/** Carte produit utilisée dans les listes. */
function productCardHtml(p) {
    const stock = UI.stockInfo(p.stock);
    const soldOut = p.stock <= 0;
    return `
        <article class="product-card">
            <a class="product-media" href="product.html?id=${p.id}" tabindex="-1" aria-hidden="true">
                <img src="${UI.imageSrc(p.imageUrl)}" alt="" loading="lazy">
            </a>
            <div class="product-body">
                <p class="product-cat">${UI.escapeHtml(p.categoryNom)}</p>
                <h3 class="product-name"><a href="product.html?id=${p.id}">${UI.escapeHtml(p.nom)}</a></h3>
                <div class="product-meta">
                    <span class="price-tag">${UI.formatPrice(p.prix)}</span>
                    <span class="stock ${stock.css}">${stock.text}</span>
                </div>
                <button type="button" class="btn btn-block add-btn" data-id="${p.id}" ${soldOut ? 'disabled' : ''}>
                    ${soldOut ? 'Indisponible' : 'Ajouter'}
                </button>
            </div>
        </article>`;
}

/** Ajoute au panier avec un message adapté. */
function addToCart(product, quantity) {
    const added = Cart.add(product, quantity);
    if (added > 0) {
        UI.toast(`${added} × ${product.nom} ajouté${added > 1 ? 's' : ''} à votre commande`, 'success');
    } else {
        UI.toast('Quantité maximale déjà dans votre commande', 'error');
    }
    return added;
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */
const CatalogPage = (() => {
    const state = { categoryId: null, search: '', products: [] };
    let grid;
    let countEl;
    let requestId = 0;

    function syncUrl() {
        const params = new URLSearchParams();
        if (state.categoryId) params.set('categorie', state.categoryId);
        if (state.search) params.set('q', state.search);
        const query = params.toString();
        history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
    }

    async function loadCategories() {
        const container = document.getElementById('category-filters');
        try {
            const categories = await Api.get('/categories');
            const chip = (id, label) => `
                <button type="button" class="chip" data-id="${id ?? ''}"
                        aria-pressed="${String((id ?? null) === state.categoryId)}">${UI.escapeHtml(label)}</button>`;
            container.innerHTML = chip(null, 'Tout') + categories.map((c) => chip(c.id, c.nom)).join('');
        } catch (error) {
            container.innerHTML = '';
        }
    }

    async function loadProducts() {
        const current = ++requestId; // ignore les réponses d'anciennes recherches
        const params = new URLSearchParams();
        if (state.categoryId) params.set('categoryId', state.categoryId);
        if (state.search) params.set('search', state.search);

        grid.setAttribute('aria-busy', 'true');
        try {
            const products = await Api.get(`/products${params.toString() ? `?${params}` : ''}`);
            if (current !== requestId) return;
            state.products = products;
            render();
        } catch (error) {
            if (current !== requestId) return;
            countEl.textContent = '';
            grid.innerHTML = `
                <div class="empty-state">
                    <h2>Le catalogue n'a pas pu être chargé</h2>
                    <p>${UI.escapeHtml(error.message)}</p>
                    <button type="button" class="btn" id="retry-btn">Réessayer</button>
                </div>`;
            document.getElementById('retry-btn').addEventListener('click', loadProducts);
        } finally {
            if (current === requestId) grid.removeAttribute('aria-busy');
        }
    }

    function render() {
        const n = state.products.length;
        countEl.textContent = `${n} produit${n > 1 ? 's' : ''}`;

        if (n === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h2>Aucun produit ne correspond</h2>
                    <p>Essayez un autre mot ou une autre catégorie.</p>
                    <button type="button" class="btn btn-secondary" id="reset-btn">Afficher tout le catalogue</button>
                </div>`;
            document.getElementById('reset-btn').addEventListener('click', reset);
            return;
        }
        grid.innerHTML = state.products.map(productCardHtml).join('');
    }

    function reset() {
        state.categoryId = null;
        state.search = '';
        document.getElementById('search-input').value = '';
        updateChips();
        syncUrl();
        loadProducts();
    }

    function updateChips() {
        document.querySelectorAll('#category-filters .chip').forEach((chip) => {
            const id = chip.dataset.id ? Number(chip.dataset.id) : null;
            chip.setAttribute('aria-pressed', String(id === state.categoryId));
        });
    }

    function bindEvents() {
        document.getElementById('category-filters').addEventListener('click', (event) => {
            const chip = event.target.closest('.chip');
            if (!chip) return;
            state.categoryId = chip.dataset.id ? Number(chip.dataset.id) : null;
            updateChips();
            syncUrl();
            loadProducts();
        });

        let debounce;
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                state.search = searchInput.value.trim();
                syncUrl();
                loadProducts();
            }, 300);
        });
        document.getElementById('search-form').addEventListener('submit', (event) => {
            event.preventDefault();
            clearTimeout(debounce);
            state.search = searchInput.value.trim();
            syncUrl();
            loadProducts();
        });

        grid.addEventListener('click', (event) => {
            const button = event.target.closest('.add-btn');
            if (!button) return;
            const product = state.products.find((p) => p.id === Number(button.dataset.id));
            if (product) addToCart(product, 1);
        });
    }

    async function init() {
        grid = document.getElementById('product-grid');
        if (!grid) return;
        countEl = document.getElementById('product-count');

        const cat = Number(UI.getParam('categorie'));
        state.categoryId = Number.isInteger(cat) && cat > 0 ? cat : null;
        state.search = UI.getParam('q') || '';
        document.getElementById('search-input').value = state.search;

        bindEvents();
        await Promise.all([loadCategories(), loadProducts()]);
    }

    return { init };
})();

/* ------------------------------------------------------------------ */
/* Détail d'un produit                                                 */
/* ------------------------------------------------------------------ */
const ProductPage = (() => {
    let root;

    function renderError(title, message) {
        root.innerHTML = `
            <div class="empty-state">
                <h1>${UI.escapeHtml(title)}</h1>
                <p>${UI.escapeHtml(message)}</p>
                <a class="btn" href="index.html">Retour au catalogue</a>
            </div>`;
    }

    function render(p) {
        document.title = `${p.nom} | Le Comptoir de 3iL`;
        const stock = UI.stockInfo(p.stock);
        const soldOut = p.stock <= 0;
        const max = Math.min(p.stock, 100);
        const description = UI.escapeHtml(p.description || 'Pas de description pour ce produit.')
            .split(/\n+/).map((para) => `<p>${para}</p>`).join('');

        root.innerHTML = `
            <nav class="breadcrumb" aria-label="Fil d'Ariane">
                <a href="index.html">Catalogue</a>
                <span aria-hidden="true">/</span>
                <a href="index.html?categorie=${p.categoryId}">${UI.escapeHtml(p.categoryNom)}</a>
            </nav>
            <div class="product-detail">
                <div class="product-detail-media">
                    <img src="${UI.imageSrc(p.imageUrl)}" alt="${UI.escapeHtml(p.nom)}">
                </div>
                <div class="product-detail-info">
                    <h1>${UI.escapeHtml(p.nom)}</h1>
                    <span class="price-tag price-tag-large">${UI.formatPrice(p.prix)}</span>
                    <p class="stock ${stock.css}">${stock.text}</p>
                    <div class="product-description">${description}</div>
                    <form class="add-form" id="add-form" novalidate>
                        <label class="qty-field">
                            <span>Quantité</span>
                            <input type="number" name="quantite" min="1" max="${Math.max(max, 1)}" value="1"
                                   inputmode="numeric" ${soldOut ? 'disabled' : ''}>
                        </label>
                        <button type="submit" class="btn" ${soldOut ? 'disabled' : ''}>
                            ${soldOut ? 'Indisponible' : 'Ajouter à ma commande'}
                        </button>
                    </form>
                    <p class="muted small" id="in-cart-note"></p>
                </div>
            </div>
            <section class="related" id="related" hidden>
                <h2>Dans la même catégorie</h2>
                <div class="product-grid" id="related-grid"></div>
            </section>`;

        updateInCartNote(p);

        document.getElementById('add-form').addEventListener('submit', (event) => {
            event.preventDefault();
            const input = event.target.quantite;
            const qty = Math.floor(Number(input.value));
            if (!qty || qty < 1) {
                UI.toast('Indiquez une quantité valide', 'error');
                input.focus();
                return;
            }
            if (qty > p.stock) {
                UI.toast(`Seulement ${p.stock} disponible${p.stock > 1 ? 's' : ''} pour ce produit`, 'error');
                input.value = Math.max(1, max);
                input.focus();
                return;
            }
            addToCart(p, qty);
            updateInCartNote(p);
        });
    }

    function updateInCartNote(p) {
        const line = Cart.items().find((i) => i.productId === p.id);
        const note = document.getElementById('in-cart-note');
        if (note) {
            note.innerHTML = line
                ? `Déjà ${line.quantite} dans votre <a href="cart.html">commande</a>.`
                : '';
        }
    }

    async function loadRelated(p) {
        try {
            const products = await Api.get(`/products?categoryId=${p.categoryId}`);
            const others = products.filter((x) => x.id !== p.id).slice(0, 4);
            if (!others.length) return;
            const grid = document.getElementById('related-grid');
            grid.innerHTML = others.map(productCardHtml).join('');
            document.getElementById('related').hidden = false;
            grid.addEventListener('click', (event) => {
                const button = event.target.closest('.add-btn');
                if (!button) return;
                const product = others.find((x) => x.id === Number(button.dataset.id));
                if (product) addToCart(product, 1);
            });
        } catch {
            // La section "même catégorie" est facultative
        }
    }

    async function init() {
        root = document.getElementById('product-root');
        if (!root) return;

        const id = Number(UI.getParam('id'));
        if (!Number.isInteger(id) || id <= 0) {
            renderError('Produit introuvable', 'Le lien utilisé ne correspond à aucun produit.');
            return;
        }
        try {
            const product = await Api.get(`/products/${id}`);
            render(product);
            loadRelated(product);
        } catch (error) {
            if (error.status === 404) {
                renderError('Produit introuvable', 'Ce produit n\u2019existe pas ou a été retiré de la vente.');
            } else {
                renderError('Le produit n\u2019a pas pu être chargé', error.message);
            }
        }
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    CatalogPage.init();
    ProductPage.init();
});
