/**
 * orders.js
 * Historique des commandes de l'utilisateur connecté (orders.html).
 */
const OrdersPage = (() => {
    function orderHtml(order, highlight) {
        const rows = order.items.map((i) => `
            <tr>
                <td><a href="product.html?id=${i.productId}">${UI.escapeHtml(i.nomProduit)}</a></td>
                <td class="num">${i.quantite}</td>
                <td class="num">${UI.formatPrice(i.prixUnitaire)}</td>
                <td class="num">${UI.formatPrice(i.sousTotal)}</td>
            </tr>`).join('');

        return `
            <article class="order-card${highlight ? ' is-new' : ''}" id="commande-${order.id}">
                <header class="order-head">
                    <div>
                        <h2>Ticket <span class="ticket-chip">${UI.escapeHtml(order.numeroTicket)}</span></h2>
                        <p class="muted">Commandé le ${UI.formatDate(order.dateCommande)}</p>
                    </div>
                    ${UI.statusBadge(order.statut)}
                </header>
                <div class="table-scroll">
                    <table class="simple-table">
                        <thead>
                            <tr><th scope="col">Produit</th><th scope="col" class="num">Qté</th>
                                <th scope="col" class="num">Prix unitaire</th><th scope="col" class="num">Sous-total</th></tr>
                        </thead>
                        <tbody>${rows}</tbody>
                        <tfoot>
                            <tr><th scope="row" colspan="3">Total</th><td class="num"><strong>${UI.formatPrice(order.total)}</strong></td></tr>
                        </tfoot>
                    </table>
                </div>
            </article>`;
    }

    async function init() {
        const root = document.getElementById('orders-root');
        if (!root) return;
        if (!Auth.requireLogin()) return;

        const highlightId = Number(UI.getParam('nouvelle'));
        try {
            const orders = await Api.get('/orders/me');
            if (!orders.length) {
                root.innerHTML = `
                    <div class="empty-state">
                        <h2>Aucun ticket pour l'instant</h2>
                        <p>Vos tickets de retrait apparaîtront ici dès votre première commande.</p>
                        <a class="btn" href="index.html">Voir la carte</a>
                    </div>`;
                return;
            }
            root.innerHTML = orders.map((o) => orderHtml(o, o.id === highlightId)).join('');
            if (highlightId) {
                document.getElementById(`commande-${highlightId}`)?.scrollIntoView({ block: 'start' });
            }
        } catch (error) {
            if (error.status === 401) {
                Auth.requireLogin();
                return;
            }
            UI.showAlert(root, error.message);
        }
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', OrdersPage.init);
