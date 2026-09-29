/**
 * admin.js
 * Espace d'administration : tableau de bord, produits, catégories, commandes.
 * Chaque page déclare son nom avec <body data-page="...">.
 * Le serveur vérifie le rôle ADMIN à chaque appel : ce contrôle côté front
 * sert seulement à rediriger proprement.
 */

/* ------------------------------------------------------------------ */
/* Mise en page commune                                                */
/* ------------------------------------------------------------------ */
const AdminLayout = (() => {
    const LINKS = [
        { page: 'dashboard', href: 'dashboard.html', label: 'Tableau de bord' },
        { page: 'products', href: 'products.html', label: 'Produits' },
        { page: 'categories', href: 'categories.html', label: 'Catégories' },
        { page: 'orders', href: 'orders.html', label: 'Commandes' },
    ];

    function render() {
        const sidebar = document.getElementById('admin-sidebar');
        if (!sidebar) return;
        const current = document.body.dataset.page;
        const user = Auth.getUser();

        sidebar.innerHTML = `
            <a class="admin-brand" href="dashboard.html">Le Comptoir de 3iL <span>Administration</span></a>
            <nav class="admin-nav" aria-label="Administration">
                ${LINKS.map((l) => `
                    <a href="${l.href}"${l.page === current ? ' aria-current="page"' : ''}>${l.label}</a>`).join('')}
            </nav>
            <div class="admin-sidebar-foot">
                <a href="../index.html">Voir la boutique</a>
                <p class="admin-user">${UI.escapeHtml(user?.nom || '')}<br><span>${UI.escapeHtml(user?.email || '')}</span></p>
                <button type="button" class="btn btn-small btn-on-dark" id="admin-logout">Se déconnecter</button>
            </div>`;
        document.getElementById('admin-logout').addEventListener('click', Auth.logout);
    }

    return { render };
})();

/** Gestion commune des erreurs de l'admin (session expirée, droits...). */
function handleAdminError(error, alertBox) {
    if (error.status === 401 || error.status === 403) {
        Auth.clearSession();
        Auth.requireAdmin();
        return;
    }
    if (alertBox) UI.showAlert(alertBox, error.message);
    else UI.toast(error.message, 'error');
}

/** Ouvre une boîte de dialogue <dialog> en réinitialisant ses messages. */
function openDialog(dialog) {
    const form = dialog.querySelector('form');
    UI.showFieldErrors(form, null);
    UI.showAlert(dialog.querySelector('.dialog-alert'), '');
    dialog.showModal();
    form.querySelector('input:not([type="hidden"]), select, textarea')?.focus();
}

/* ------------------------------------------------------------------ */
/* Tableau de bord                                                     */
/* ------------------------------------------------------------------ */
const DashboardPage = (() => {
    async function init() {
        const alertBox = document.getElementById('page-alert');
        try {
            const [stats, orders, products] = await Promise.all([
                Api.get('/admin/stats'),
                Api.get('/admin/orders'),
                Api.get('/admin/products'),
            ]);

            document.getElementById('stats').innerHTML = `
                <div class="stat stat-main"><dt>Chiffre d'affaires</dt><dd>${UI.formatPrice(stats.chiffreAffaires)}</dd></div>
                <div class="stat"><dt>Commandes</dt><dd>${stats.nombreCommandes}</dd></div>
                <div class="stat"><dt>À préparer</dt><dd>${stats.commandesEnAttente}</dd></div>
                <div class="stat"><dt>Produits</dt><dd>${stats.nombreProduits}</dd></div>
                <div class="stat"><dt>Catégories</dt><dd>${stats.nombreCategories}</dd></div>
                <div class="stat"><dt>Clients</dt><dd>${stats.nombreClients}</dd></div>`;

            const recent = orders.slice(0, 5);
            document.getElementById('recent-orders').innerHTML = recent.length
                ? `<div class="table-wrap"><table class="data-table">
                        <thead><tr><th scope="col">Ticket</th><th scope="col">Date</th><th scope="col">Client</th>
                            <th scope="col" class="num">Total</th><th scope="col">Statut</th></tr></thead>
                        <tbody>${recent.map((o) => `
                            <tr>
                                <td><span class="ticket-chip">${UI.escapeHtml(o.numeroTicket)}</span></td>
                                <td>${UI.formatDate(o.dateCommande)}</td>
                                <td>${UI.escapeHtml(o.clientNom)}</td>
                                <td class="num">${UI.formatPrice(o.total)}</td>
                                <td>${UI.statusBadge(o.statut)}</td>
                            </tr>`).join('')}
                        </tbody></table></div>`
                : '<p class="muted">Aucune commande pour le moment.</p>';

            const low = products
                .filter((p) => p.stock < CONFIG.LOW_STOCK_THRESHOLD)
                .sort((a, b) => a.stock - b.stock);
            document.getElementById('low-stock').innerHTML = low.length
                ? `<ul class="stock-list">${low.map((p) => `
                        <li>
                            <span>${UI.escapeHtml(p.nom)}</span>
                            <span class="stock ${UI.stockInfo(p.stock).css}">${p.stock === 0 ? 'Rupture' : `${p.stock} restant${p.stock > 1 ? 's' : ''}`}</span>
                        </li>`).join('')}</ul>
                   <a href="products.html" class="small">Gérer les stocks</a>`
                : '<p class="muted">Tous les produits ont un stock suffisant.</p>';
        } catch (error) {
            handleAdminError(error, alertBox);
        }
    }

    return { init };
})();

/* ------------------------------------------------------------------ */
/* Produits                                                            */
/* ------------------------------------------------------------------ */
const ProductsAdminPage = (() => {
    let products = [];
    let categories = [];
    let tbody;
    let dialog;
    let form;
    let alertBox;

    function categoryOptions(selectedId, withAll) {
        const first = withAll ? '<option value="">Toutes les catégories</option>' : '<option value="">Choisir une catégorie</option>';
        return first + categories.map((c) =>
            `<option value="${c.id}"${c.id === selectedId ? ' selected' : ''}>${UI.escapeHtml(c.nom)}</option>`).join('');
    }

    function render() {
        const search = document.getElementById('filter-search').value.trim().toLowerCase();
        const categoryId = Number(document.getElementById('filter-category').value) || null;
        const list = products.filter((p) =>
            (!categoryId || p.categoryId === categoryId) && p.nom.toLowerCase().includes(search));

        document.getElementById('product-total').textContent =
            `${list.length} produit${list.length > 1 ? 's' : ''}`;

        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Aucun produit ne correspond à ces filtres.</td></tr>';
            return;
        }

        tbody.innerHTML = list.map((p) => `
            <tr data-id="${p.id}">
                <td><img class="thumb" src="${UI.imageSrc(p.imageUrl)}" alt="" loading="lazy"></td>
                <td>
                    <strong>${UI.escapeHtml(p.nom)}</strong>
                    <span class="muted small cell-sub">Réf. ${p.id}</span>
                </td>
                <td>${UI.escapeHtml(p.categoryNom)}</td>
                <td class="num">${UI.formatPrice(p.prix)}</td>
                <td>
                    <form class="stock-form">
                        <label class="sr-only" for="stock-${p.id}">Stock de ${UI.escapeHtml(p.nom)}</label>
                        <input id="stock-${p.id}" type="number" name="stock" min="0" value="${p.stock}"
                               class="stock-input ${UI.stockInfo(p.stock).css}">
                        <button type="submit" class="btn btn-small btn-secondary">Valider</button>
                    </form>
                </td>
                <td class="actions">
                    <button type="button" class="btn btn-small btn-secondary edit-btn">Modifier</button>
                    <button type="button" class="btn btn-small btn-danger delete-btn">Supprimer</button>
                </td>
            </tr>`).join('');
    }

    async function load() {
        try {
            [products, categories] = await Promise.all([
                Api.get('/admin/products'),
                Api.get('/categories'),
            ]);
            const filter = document.getElementById('filter-category');
            const selected = Number(filter.value) || null;
            filter.innerHTML = categoryOptions(selected, true);
            render();
        } catch (error) {
            handleAdminError(error, alertBox);
        }
    }

    function openForm(product) {
        form.reset();
        form.recordId.value = product?.id ?? '';
        form.nom.value = product?.nom ?? '';
        form.description.value = product?.description ?? '';
        form.prix.value = product?.prix ?? '';
        form.stock.value = product?.stock ?? 0;
        form.imageUrl.value = product?.imageUrl ?? '';
        form.categoryId.innerHTML = categoryOptions(product?.categoryId ?? null, false);
        dialog.querySelector('.dialog-title').textContent = product ? 'Modifier le produit' : 'Ajouter un produit';
        form.querySelector('button[type="submit"]').textContent = product ? 'Enregistrer' : 'Ajouter le produit';
        updatePreview();
        openDialog(dialog);
    }

    function updatePreview() {
        const preview = document.getElementById('image-preview');
        const url = form.imageUrl.value.trim();
        preview.removeAttribute('data-fallback');
        preview.src = /^https?:\/\//.test(url) ? url : UI.PLACEHOLDER_IMAGE;
    }

    async function submitForm(event) {
        event.preventDefault();
        const id = form.recordId.value;
        const payload = {
            nom: form.nom.value.trim(),
            description: form.description.value.trim(),
            prix: form.prix.value === '' ? null : Number(form.prix.value),
            stock: form.stock.value === '' ? null : Number(form.stock.value),
            imageUrl: form.imageUrl.value.trim(),
            categoryId: form.categoryId.value ? Number(form.categoryId.value) : null,
        };
        const button = form.querySelector('button[type="submit"]');
        UI.showFieldErrors(form, null);
        UI.showAlert(dialog.querySelector('.dialog-alert'), '');

        try {
            await UI.withBusy(button, 'Enregistrement\u2026', () => (id
                ? Api.put(`/admin/products/${id}`, payload)
                : Api.post('/admin/products', payload)));
            dialog.close();
            UI.toast(id ? 'Produit enregistré' : 'Produit ajouté', 'success');
            await load();
        } catch (error) {
            if (error.status === 401 || error.status === 403) return handleAdminError(error);
            UI.showFieldErrors(form, error.details);
            UI.showAlert(dialog.querySelector('.dialog-alert'), error.message);
        }
    }

    async function updateStock(formEl) {
        const row = formEl.closest('tr');
        const id = Number(row.dataset.id);
        const stock = Number(formEl.stock.value);
        if (!Number.isInteger(stock) || stock < 0) {
            UI.toast('Le stock doit être un nombre entier positif', 'error');
            return;
        }
        try {
            const updated = await UI.withBusy(formEl.querySelector('button'), '\u2026',
                () => Api.patch(`/admin/products/${id}/stock`, { stock }));
            const index = products.findIndex((p) => p.id === id);
            products[index] = updated;
            render();
            UI.toast(`Stock de « ${updated.nom} » : ${updated.stock}`, 'success');
        } catch (error) {
            handleAdminError(error);
        }
    }

    async function remove(id) {
        const product = products.find((p) => p.id === id);
        if (!confirm(`Supprimer « ${product.nom} » ? Cette action est définitive.`)) return;
        try {
            await Api.delete(`/admin/products/${id}`);
            products = products.filter((p) => p.id !== id);
            render();
            UI.toast('Produit supprimé', 'success');
        } catch (error) {
            handleAdminError(error);
        }
    }

    async function init() {
        tbody = document.getElementById('products-body');
        dialog = document.getElementById('product-dialog');
        form = document.getElementById('product-form');
        alertBox = document.getElementById('page-alert');

        document.getElementById('add-product-btn').addEventListener('click', () => {
            if (!categories.length) {
                UI.toast('Créez d\u2019abord une catégorie', 'error');
                return;
            }
            openForm(null);
        });
        document.getElementById('filter-search').addEventListener('input', render);
        document.getElementById('filter-category').addEventListener('change', render);
        form.addEventListener('submit', submitForm);
        form.imageUrl.addEventListener('change', updatePreview);
        dialog.querySelector('.dialog-cancel').addEventListener('click', () => dialog.close());

        tbody.addEventListener('submit', (event) => {
            if (!event.target.classList.contains('stock-form')) return;
            event.preventDefault();
            updateStock(event.target);
        });
        tbody.addEventListener('click', (event) => {
            const row = event.target.closest('tr');
            if (!row?.dataset.id) return;
            const id = Number(row.dataset.id);
            if (event.target.classList.contains('edit-btn')) {
                openForm(products.find((p) => p.id === id));
            } else if (event.target.classList.contains('delete-btn')) {
                remove(id);
            }
        });

        await load();
    }

    return { init };
})();

/* ------------------------------------------------------------------ */
/* Catégories                                                          */
/* ------------------------------------------------------------------ */
const CategoriesAdminPage = (() => {
    let categories = [];
    let tbody;
    let dialog;
    let form;

    function render() {
        if (!categories.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">Aucune catégorie. Ajoutez-en une pour commencer.</td></tr>';
            return;
        }
        tbody.innerHTML = categories.map((c) => `
            <tr data-id="${c.id}">
                <td><strong>${UI.escapeHtml(c.nom)}</strong></td>
                <td>${c.description ? UI.escapeHtml(c.description) : '<span class="muted">Sans description</span>'}</td>
                <td class="num">${c.nombreProduits}</td>
                <td class="actions">
                    <button type="button" class="btn btn-small btn-secondary edit-btn">Modifier</button>
                    <button type="button" class="btn btn-small btn-danger delete-btn"
                        ${c.nombreProduits > 0 ? 'disabled title="Cette catégorie contient des produits"' : ''}>Supprimer</button>
                </td>
            </tr>`).join('');
    }

    async function load() {
        try {
            categories = await Api.get('/categories');
            render();
        } catch (error) {
            handleAdminError(error, document.getElementById('page-alert'));
        }
    }

    function openForm(category) {
        form.reset();
        form.recordId.value = category?.id ?? '';
        form.nom.value = category?.nom ?? '';
        form.description.value = category?.description ?? '';
        dialog.querySelector('.dialog-title').textContent = category ? 'Modifier la catégorie' : 'Ajouter une catégorie';
        form.querySelector('button[type="submit"]').textContent = category ? 'Enregistrer' : 'Ajouter la catégorie';
        openDialog(dialog);
    }

    async function submitForm(event) {
        event.preventDefault();
        const id = form.recordId.value;
        const payload = { nom: form.nom.value.trim(), description: form.description.value.trim() };
        const button = form.querySelector('button[type="submit"]');
        UI.showFieldErrors(form, null);

        try {
            await UI.withBusy(button, 'Enregistrement\u2026', () => (id
                ? Api.put(`/admin/categories/${id}`, payload)
                : Api.post('/admin/categories', payload)));
            dialog.close();
            UI.toast(id ? 'Catégorie enregistrée' : 'Catégorie ajoutée', 'success');
            await load();
        } catch (error) {
            if (error.status === 401 || error.status === 403) return handleAdminError(error);
            UI.showFieldErrors(form, error.details);
            UI.showAlert(dialog.querySelector('.dialog-alert'), error.message);
        }
    }

    async function remove(id) {
        const category = categories.find((c) => c.id === id);
        if (!confirm(`Supprimer la catégorie « ${category.nom} » ?`)) return;
        try {
            await Api.delete(`/admin/categories/${id}`);
            UI.toast('Catégorie supprimée', 'success');
            await load();
        } catch (error) {
            handleAdminError(error);
        }
    }

    async function init() {
        tbody = document.getElementById('categories-body');
        dialog = document.getElementById('category-dialog');
        form = document.getElementById('category-form');

        document.getElementById('add-category-btn').addEventListener('click', () => openForm(null));
        form.addEventListener('submit', submitForm);
        dialog.querySelector('.dialog-cancel').addEventListener('click', () => dialog.close());

        tbody.addEventListener('click', (event) => {
            const row = event.target.closest('tr');
            if (!row?.dataset.id) return;
            const id = Number(row.dataset.id);
            if (event.target.classList.contains('edit-btn')) {
                openForm(categories.find((c) => c.id === id));
            } else if (event.target.classList.contains('delete-btn')) {
                remove(id);
            }
        });

        await load();
    }

    return { init };
})();

/* ------------------------------------------------------------------ */
/* Commandes                                                           */
/* ------------------------------------------------------------------ */
const OrdersAdminPage = (() => {
    let orders = [];
    let tbody;

    function statusSelect(order) {
        return `
            <label class="sr-only" for="status-${order.id}">Statut du ticket ${order.numeroTicket}</label>
            <select id="status-${order.id}" class="status-select" data-previous="${order.statut}">
                ${Object.entries(UI.STATUS_LABELS).map(([value, label]) =>
                    `<option value="${value}"${value === order.statut ? ' selected' : ''}>${label}</option>`).join('')}
            </select>`;
    }

    function render() {
        const filter = document.getElementById('filter-status').value;
        const list = filter ? orders.filter((o) => o.statut === filter) : orders;
        document.getElementById('order-total').textContent =
            `${list.length} commande${list.length > 1 ? 's' : ''}`;

        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">Aucune commande avec ce statut.</td></tr>';
            return;
        }

        tbody.innerHTML = list.map((o) => {
            const articles = o.items.reduce((sum, i) => sum + i.quantite, 0);
            return `
                <tr data-id="${o.id}">
                    <td><span class="ticket-chip">${UI.escapeHtml(o.numeroTicket)}</span></td>
                    <td>${UI.formatDate(o.dateCommande)}</td>
                    <td>${UI.escapeHtml(o.clientNom)}<span class="muted small cell-sub">${UI.escapeHtml(o.clientEmail)}</span></td>
                    <td>
                        <details class="order-details">
                            <summary>${articles} article${articles > 1 ? 's' : ''}</summary>
                            <ul>${o.items.map((i) => `
                                <li>${i.quantite} × ${UI.escapeHtml(i.nomProduit)}
                                    <span class="muted">(${UI.formatPrice(i.prixUnitaire)})</span></li>`).join('')}
                            </ul>
                        </details>
                    </td>
                    <td class="num">${UI.formatPrice(o.total)}</td>
                    <td>${UI.statusBadge(o.statut)}</td>
                    <td>${statusSelect(o)}</td>
                </tr>`;
        }).join('');
    }

    async function changeStatus(select) {
        const id = Number(select.closest('tr').dataset.id);
        const statut = select.value;
        select.disabled = true;
        try {
            const updated = await Api.patch(`/admin/orders/${id}/status`, { statut });
            orders[orders.findIndex((o) => o.id === id)] = updated;
            render();
            UI.toast(`Ticket ${updated.numeroTicket} : ${UI.statusLabel(updated.statut).toLowerCase()}`, 'success');
        } catch (error) {
            select.value = select.dataset.previous;
            select.disabled = false;
            handleAdminError(error);
        }
    }

    async function init() {
        tbody = document.getElementById('orders-body');
        const filter = document.getElementById('filter-status');
        filter.innerHTML = '<option value="">Tous les statuts</option>' +
            Object.entries(UI.STATUS_LABELS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
        filter.addEventListener('change', render);

        tbody.addEventListener('change', (event) => {
            if (event.target.classList.contains('status-select')) changeStatus(event.target);
        });

        try {
            orders = await Api.get('/admin/orders');
            render();
        } catch (error) {
            handleAdminError(error, document.getElementById('page-alert'));
        }
    }

    return { init };
})();

/* ------------------------------------------------------------------ */
/* Démarrage                                                           */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.requireAdmin()) return;
    AdminLayout.render();

    const pages = {
        dashboard: DashboardPage,
        products: ProductsAdminPage,
        categories: CategoriesAdminPage,
        orders: OrdersAdminPage,
    };
    pages[document.body.dataset.page]?.init();
});
