-- =====================================================================
-- Données de test chargées à chaque démarrage (base H2 en mémoire).
-- Les identifiants sont générés automatiquement : les relations sont
-- donc retrouvées par sous-requêtes (nom de catégorie, email, numéro de ticket).
-- =====================================================================

-- ---------- Utilisateurs ----------
-- admin@ecommerce.com / admin123   (rôle ADMIN)
-- user@ecommerce.com  / user123    (rôle USER)
INSERT INTO users (email, password, nom, role) VALUES
('admin@ecommerce.com', '$2a$10$9dcWIo2wLEp9xM6zKVcfcuH7xIywRQ9F5n4axpVaLUTRrHSwU7CIK', 'Administrateur', 'ADMIN'),
('user@ecommerce.com',  '$2a$10$mPgEBG4jO36JnuMfq/XQUeIHf6.UhfOj7KwKCQRCFr/yNYPs.Z54y', 'Camille Martin', 'USER');

-- ---------- Catégories ----------
INSERT INTO categories (nom, description) VALUES
('Sandwichs', 'Sandwichs, paninis et wraps préparés le matin même'),
('Boissons', 'Boissons fraîches et boissons chaudes du distributeur'),
('Snacks', 'Petites faims sucrées et salées pour la pause'),
('Petit-déjeuner', 'Viennoiseries et formules avant les premiers cours');

-- ---------- Produits ----------
INSERT INTO products (nom, description, prix, stock, image_url, category_id) VALUES
('Sandwich jambon-beurre',
 'Baguette tradition, jambon blanc et beurre doux. Le classique qui part le plus vite à 12 h.',
 3.20, 30, 'https://picsum.photos/seed/sandwich-jambon/800/600',
 (SELECT id FROM categories WHERE nom = 'Sandwichs')),

('Sandwich poulet crudités',
 'Poulet rôti, salade, tomate et sauce fromage blanc citronnée. Préparé le matin même.',
 3.90, 24, 'https://picsum.photos/seed/sandwich-poulet/800/600',
 (SELECT id FROM categories WHERE nom = 'Sandwichs')),

('Panini chèvre-miel',
 'Pain panini pressé au chèvre fondu, miel et noix. Servi chaud, à retirer au comptoir.',
 4.20, 18, 'https://picsum.photos/seed/panini-chevre/800/600',
 (SELECT id FROM categories WHERE nom = 'Sandwichs')),

('Wrap végétarien',
 'Galette de blé, houmous, courgettes grillées, poivrons et roquette. Sans produit d''origine animale.',
 4.50, 15, 'https://picsum.photos/seed/wrap-vegetarien/800/600',
 (SELECT id FROM categories WHERE nom = 'Sandwichs')),

('Salade César',
 'Salade romaine, poulet grillé, copeaux de parmesan et croûtons. Sauce à part, fourchette incluse.',
 5.50, 3, 'https://picsum.photos/seed/salade-cesar/800/600',
 (SELECT id FROM categories WHERE nom = 'Sandwichs')),

('Café expresso',
 'Expresso serré en gobelet 12 cl. Le carburant officiel des TP du lundi matin.',
 0.90, 100, 'https://picsum.photos/seed/cafe-expresso/800/600',
 (SELECT id FROM categories WHERE nom = 'Boissons')),

('Bouteille d''eau 50 cl',
 'Eau de source plate, bouteille de 50 cl. Bouteille consignée à rapporter au comptoir.',
 1.00, 80, 'https://picsum.photos/seed/bouteille-eau/800/600',
 (SELECT id FROM categories WHERE nom = 'Boissons')),

('Canette de soda 33 cl',
 'Soda au cola, canette de 33 cl servie fraîche.',
 1.50, 45, 'https://picsum.photos/seed/canette-soda/800/600',
 (SELECT id FROM categories WHERE nom = 'Boissons')),

('Jus d''orange pressé',
 'Jus d''orange pressé le matin, sans sucre ajouté. Bouteille de 25 cl.',
 2.20, 20, 'https://picsum.photos/seed/jus-orange/800/600',
 (SELECT id FROM categories WHERE nom = 'Boissons')),

('Chocolat chaud',
 'Chocolat chaud onctueux en gobelet 20 cl, avec un petit spéculoos.',
 1.40, 0, 'https://picsum.photos/seed/chocolat-chaud/800/600',
 (SELECT id FROM categories WHERE nom = 'Boissons')),

('Cookie aux pépites de chocolat',
 'Cookie moelleux cuit sur place, généreux en pépites de chocolat noir.',
 1.50, 40, 'https://picsum.photos/seed/cookie-choco/800/600',
 (SELECT id FROM categories WHERE nom = 'Snacks')),

('Muffin myrtille',
 'Muffin moelleux aux myrtilles, préparé par la boulangerie du quartier.',
 2.00, 22, 'https://picsum.photos/seed/muffin-myrtille/800/600',
 (SELECT id FROM categories WHERE nom = 'Snacks')),

('Barre chocolatée',
 'Barre chocolatée caramel et cacahuètes, 50 g. Idéale entre deux amphis.',
 1.20, 60, 'https://picsum.photos/seed/barre-choco/800/600',
 (SELECT id FROM categories WHERE nom = 'Snacks')),

('Sachet de chips 30 g',
 'Chips nature à l''huile de tournesol, sachet individuel de 30 g.',
 1.30, 50, 'https://picsum.photos/seed/chips-nature/800/600',
 (SELECT id FROM categories WHERE nom = 'Snacks')),

('Croissant pur beurre',
 'Croissant pur beurre livré chaque matin à 7 h 30.',
 1.10, 35, 'https://picsum.photos/seed/croissant-beurre/800/600',
 (SELECT id FROM categories WHERE nom = 'Petit-déjeuner')),

('Pain au chocolat',
 'Viennoiserie pur beurre à deux barres de chocolat.',
 1.20, 28, 'https://picsum.photos/seed/pain-chocolat/800/600',
 (SELECT id FROM categories WHERE nom = 'Petit-déjeuner')),

('Formule petit-déjeuner',
 'Une boisson chaude au choix et une viennoiserie. À retirer avant 10 h sur présentation du ticket.',
 2.50, 25, 'https://picsum.photos/seed/formule-petitdej/800/600',
 (SELECT id FROM categories WHERE nom = 'Petit-déjeuner'));

-- ---------- Commandes d'exemple (pour le tableau de bord) ----------
-- Le numéro de ticket suit l'id de la commande : 3iL-0001, 3iL-0002...
INSERT INTO orders (user_id, numero_ticket, date_commande, statut, total) VALUES
((SELECT id FROM users WHERE email = 'user@ecommerce.com'), '3iL-0001', TIMESTAMP '2026-09-15 10:22:00', 'RETIREE', 6.90),
((SELECT id FROM users WHERE email = 'user@ecommerce.com'), '3iL-0002', TIMESTAMP '2026-09-17 08:05:00', 'PRETE', 3.10),
((SELECT id FROM users WHERE email = 'user@ecommerce.com'), '3iL-0003', TIMESTAMP '2026-09-17 12:31:00', 'EN_ATTENTE', 8.40);

-- Ticket 3iL-0001 : sandwich poulet + soda + cookie = 3.90 + 1.50 + 1.50 = 6.90
INSERT INTO order_items (order_id, product_id, nom_produit, quantite, prix_unitaire) VALUES
((SELECT id FROM orders WHERE numero_ticket = '3iL-0001'), (SELECT id FROM products WHERE nom = 'Sandwich poulet crudités'), 'Sandwich poulet crudités', 1, 3.90),
((SELECT id FROM orders WHERE numero_ticket = '3iL-0001'), (SELECT id FROM products WHERE nom = 'Canette de soda 33 cl'), 'Canette de soda 33 cl', 1, 1.50),
((SELECT id FROM orders WHERE numero_ticket = '3iL-0001'), (SELECT id FROM products WHERE nom = 'Cookie aux pépites de chocolat'), 'Cookie aux pépites de chocolat', 1, 1.50);

-- Ticket 3iL-0002 : 2 croissants + 1 expresso = 2.20 + 0.90 = 3.10
INSERT INTO order_items (order_id, product_id, nom_produit, quantite, prix_unitaire) VALUES
((SELECT id FROM orders WHERE numero_ticket = '3iL-0002'), (SELECT id FROM products WHERE nom = 'Croissant pur beurre'), 'Croissant pur beurre', 2, 1.10),
((SELECT id FROM orders WHERE numero_ticket = '3iL-0002'), (SELECT id FROM products WHERE nom = 'Café expresso'), 'Café expresso', 1, 0.90);

-- Ticket 3iL-0003 : panini + jus d'orange + muffin = 4.20 + 2.20 + 2.00 = 8.40
INSERT INTO order_items (order_id, product_id, nom_produit, quantite, prix_unitaire) VALUES
((SELECT id FROM orders WHERE numero_ticket = '3iL-0003'), (SELECT id FROM products WHERE nom = 'Panini chèvre-miel'), 'Panini chèvre-miel', 1, 4.20),
((SELECT id FROM orders WHERE numero_ticket = '3iL-0003'), (SELECT id FROM products WHERE nom = 'Jus d''orange pressé'), 'Jus d''orange pressé', 1, 2.20),
((SELECT id FROM orders WHERE numero_ticket = '3iL-0003'), (SELECT id FROM products WHERE nom = 'Muffin myrtille'), 'Muffin myrtille', 1, 2.00);
