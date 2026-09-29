# Le Comptoir de 3iL : commande de pause en ligne (projet étudiant)

Les étudiants commandent leur pause en ligne, puis retirent leur commande au comptoir en présentant le numéro de ticket attribué à la validation (`3iL-0001`, `3iL-0002`...).

Application e-commerce complète :

- **back-end** : API REST Java 17 / Spring Boot 3.5 (JPA, Spring Security + JWT, H2, Lombok, Bean Validation)
- **front-end** : HTML, CSS et JavaScript sans framework (fetch, localStorage)

Fonctionnalités : carte avec filtre par catégorie et recherche, fiche article, commande en cours, inscription et connexion, validation de commande avec contrôle du stock, numéro de ticket de retrait, historique des tickets, et un espace d'administration (tableau de bord, produits, catégories, commandes).

## Sommaire

1. [Structure du projet](#structure-du-projet)
2. [Lancer le projet en local](#lancer-le-projet-en-local)
3. [Comptes de test](#comptes-de-test)
4. [Mettre le projet en ligne (Vercel + Render)](#mettre-le-projet-en-ligne-vercel--render)
5. [Routes de l'API](#routes-de-lapi)
6. [Choix techniques](#choix-techniques)
7. [Problèmes fréquents](#problèmes-fréquents)

---

## Structure du projet

```
ecommerce-app/
├── backend/                     API Spring Boot
│   ├── pom.xml
│   ├── Dockerfile               image utilisée pour le déploiement
│   └── src/main/
│       ├── java/com/ecommerce/
│       │   ├── EcommerceApplication.java
│       │   ├── config/          SecurityConfig, CorsConfig
│       │   ├── controller/      Auth, Product, Category, Order, Admin, Health
│       │   ├── dto/             objets échangés avec le front (records)
│       │   ├── exception/       exceptions métier + GlobalExceptionHandler
│       │   ├── model/           entités JPA (User, Product, Category, Order, OrderItem)
│       │   ├── repository/      interfaces Spring Data JPA
│       │   ├── security/        JwtUtil, JwtFilter, CustomUserDetailsService
│       │   └── service/         logique métier
│       └── resources/
│           ├── application.properties
│           └── data.sql         données de test
├── frontend/                    site statique (déployé sur Vercel)
│   ├── index.html               catalogue
│   ├── product.html             fiche produit
│   ├── cart.html                panier
│   ├── orders.html              mes commandes
│   ├── login.html / register.html
│   ├── admin/                   dashboard, products, categories, orders
│   ├── css/                     style.css, admin.css
│   ├── js/                      config, api, auth, cart, products, orders, admin
│   └── vercel.json
├── render.yaml                  déploiement de l'API sur Render
└── README.md
```

---

## Lancer le projet en local

### Prérequis

- **Java 17** ou plus récent (`java -version`)
- **Maven 3.9+** (`mvn -version`), ou un IDE qui l'intègre (IntelliJ IDEA, Eclipse, VS Code avec l'extension Java)
- Un navigateur récent

> Avec IntelliJ ou Eclipse, activez le support de **Lombok** (plugin + « annotation processing ») pour éviter de fausses erreurs dans l'éditeur.

### 1. Démarrer l'API

```bash
cd backend
mvn spring-boot:run
```

L'API écoute sur **http://localhost:8080**. Pour vérifier : http://localhost:8080/api/health doit afficher `{"status":"UP",...}`.

Au démarrage, la base H2 en mémoire est créée puis remplie par `data.sql` (2 comptes, 4 catégories, 17 produits, 3 commandes). **Les données reviennent à leur état initial à chaque redémarrage.**

Console H2 : http://localhost:8080/h2-console
- JDBC URL : `jdbc:h2:mem:ecommercedb`
- User : `sa`
- Mot de passe : *(vide)*

Tests automatiques :

```bash
cd backend
mvn test
```

### 2. Ouvrir le front-end

Le front doit être servi par un petit serveur web : **n'ouvrez pas les fichiers en double-cliquant dessus** (adresse `file://`), le navigateur bloquerait les appels à l'API.

Au choix :

- **VS Code** : extension *Live Server*, clic droit sur `frontend/index.html` > *Open with Live Server* (port 5500)
- **Node.js** : `npx serve frontend -l 5500`
- **Python** : `cd frontend` puis `python -m http.server 5500`

Puis ouvrez **http://localhost:5500**.

Quand la page est servie depuis `localhost` ou `127.0.0.1`, le front appelle automatiquement `http://localhost:8080/api` (voir `frontend/js/config.js`).

---

## Comptes de test

| Rôle    | Email                 | Mot de passe |
|---------|-----------------------|--------------|
| Admin   | `admin@ecommerce.com` | `admin123`   |
| Client  | `user@ecommerce.com`  | `user123`    |

L'espace d'administration est accessible via le lien **Administration** (visible une fois connecté en admin) ou directement sur `/admin/dashboard.html`.

Produits pratiques pour tester : « Enceinte Bluetooth portable » (stock faible : 3) et « Gourde isotherme 750 ml » (rupture de stock).

---

## Mettre le projet en ligne (Vercel + Render)

**Vercel héberge des sites statiques et des fonctions serverless, mais pas un serveur Java qui tourne en continu.** Le projet est donc déployé en deux parties :

| Partie   | Hébergeur                  | Contenu        |
|----------|----------------------------|----------------|
| Front    | **Vercel** (gratuit)       | dossier `frontend` |
| API      | **Render** (gratuit, Docker) | dossier `backend`  |

Le code est déjà prêt pour ça : port lu dans `PORT`, secret JWT et origines CORS lus dans des variables d'environnement, `Dockerfile` et `render.yaml` fournis, et `https://*.vercel.app` autorisé par défaut dans le CORS.

### Étape 0 : mettre le projet sur GitHub

```bash
cd ecommerce-app
git init
git add .
git commit -m "Projet e-commerce"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/ecommerce-app.git
git push -u origin main
```

### Étape 1 : déployer l'API sur Render

1. Créez un compte sur https://render.com (connexion avec GitHub).
2. **New > Blueprint**, choisissez votre dépôt : Render lit `render.yaml` et crée le service `ecommerce-api`.
   *Sans Blueprint* : **New > Web Service**, dépôt, **Language : Docker**, **Root Directory : `backend`**, offre **Free**, puis ajoutez les variables d'environnement ci-dessous.
3. Attendez la fin du build (5 à 10 minutes la première fois).
4. Notez l'adresse du service, par exemple `https://ecommerce-api-xxxx.onrender.com`, et vérifiez `https://ecommerce-api-xxxx.onrender.com/api/health`.

Variables d'environnement :

| Variable               | Valeur                                              | Rôle |
|------------------------|-----------------------------------------------------|------|
| `JWT_SECRET`           | texte aléatoire d'au moins 32 caractères (généré automatiquement par le Blueprint) | signature des tokens |
| `CORS_ALLOWED_ORIGINS` | `https://*.vercel.app,http://localhost:*`           | sites autorisés à appeler l'API |
| `H2_CONSOLE_ENABLED`   | `false`                                             | masque la console H2 en ligne |

> Pour n'autoriser que votre site : `CORS_ALLOWED_ORIGINS=https://mon-projet.vercel.app`

### Étape 2 : indiquer l'adresse de l'API au front

Dans **`frontend/js/config.js`**, remplacez la ligne :

```js
const PROD_API_URL = 'https://VOTRE-API.onrender.com/api';
```

par l'adresse de votre API **suivie de `/api`** :

```js
const PROD_API_URL = 'https://ecommerce-api-xxxx.onrender.com/api';
```

Puis envoyez la modification :

```bash
git commit -am "Adresse de l'API de production"
git push
```

### Étape 3 : déployer le front sur Vercel

1. Créez un compte sur https://vercel.com (connexion avec GitHub).
2. **Add New > Project**, importez le dépôt.
3. Réglages :
   - **Root Directory** : `frontend` (bouton *Edit*)
   - **Framework Preset** : `Other`
   - **Build Command** : vide
   - **Output Directory** : vide
4. **Deploy**. Votre site est en ligne sur `https://votre-projet.vercel.app`.

Chaque `git push` redéploie automatiquement les deux parties.

### À savoir sur l'offre gratuite de Render

- L'API **se met en veille après 15 minutes sans visite**. La requête suivante la réveille en 30 à 60 secondes : le site affiche alors le bandeau « Le serveur démarre… ». Pensez à ouvrir le site une minute avant une soutenance.
- La base H2 est en mémoire : **au réveil, les données reviennent à celles de `data.sql`** (commandes et comptes créés en ligne effacés). C'est suffisant pour une démonstration ; pour garder les données, il faudrait passer à PostgreSQL (dépendance `org.postgresql:postgresql` et `spring.datasource.url` pointant vers la base).

*Alternative à Render* : Railway, Koyeb ou Fly.io acceptent aussi le `Dockerfile` du dossier `backend` avec les mêmes variables d'environnement.

---

## Routes de l'API

Toutes les routes commencent par `/api`. Les routes protégées attendent l'en-tête :

```
Authorization: Bearer <token>
```

### Authentification (public)

| Méthode | Route                | Corps | Réponse |
|---------|----------------------|-------|---------|
| POST    | `/api/auth/register` | `{ "nom", "email", "password" }` | 201 + token |
| POST    | `/api/auth/login`    | `{ "email", "password" }` | 200 + token |
| GET     | `/api/auth/me`       | (connecté) | profil |

### Catalogue (public)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/products` | liste ; paramètres optionnels `categoryId` et `search` |
| GET | `/api/products/{id}` | détail |
| GET | `/api/categories` | liste avec le nombre de produits |
| GET | `/api/categories/{id}` | détail |
| GET | `/api/health` | état de l'API |

### Commandes (utilisateur connecté)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/orders` | `{ "items": [ { "productId": 1, "quantite": 2 } ] }` |
| GET | `/api/orders/me` | mes commandes |
| GET | `/api/orders/me/{id}` | une de mes commandes |

### Administration (rôle ADMIN)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/admin/stats` | statistiques du tableau de bord |
| GET | `/api/admin/products` | liste des produits |
| POST | `/api/admin/products` | création |
| PUT | `/api/admin/products/{id}` | modification |
| PATCH | `/api/admin/products/{id}/stock` | `{ "stock": 10 }` |
| DELETE | `/api/admin/products/{id}` | suppression (refusée si le produit a déjà été commandé) |
| POST | `/api/admin/categories` | création |
| PUT | `/api/admin/categories/{id}` | modification |
| DELETE | `/api/admin/categories/{id}` | suppression (refusée si elle contient des produits) |
| GET | `/api/admin/orders` | toutes les commandes |
| PATCH | `/api/admin/orders/{id}/status` | `{ "statut": "PRETE" }` |

Statuts possibles : `EN_ATTENTE`, `EN_PREPARATION`, `PRETE`, `RETIREE`.

### Format des erreurs

Toutes les erreurs ont la même forme, ce qui permet au front d'afficher `message` :

```json
{
  "timestamp": "2026-09-16T10:12:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Le prix doit être supérieur à 0",
  "path": "/api/admin/products",
  "details": { "prix": "Le prix doit être supérieur à 0" }
}
```

Codes utilisés : 400 (données invalides, stock insuffisant), 401 (non connecté ou mauvais identifiants), 403 (rôle insuffisant), 404 (introuvable), 409 (email ou nom déjà utilisé).

### Essai rapide avec curl

```bash
# Connexion
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@ecommerce.com","password":"user123"}'

# Commande (remplacer TOKEN)
curl -X POST http://localhost:8080/api/orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantite":2}]}'
```

---

## Choix techniques

**Sécurité**
- Mots de passe hashés avec **BCrypt**.
- API **sans session** : chaque requête porte un **JWT** signé (HMAC-SHA), valable 24 h.
- Double contrôle des routes admin : règle d'URL dans `SecurityConfig` et `@PreAuthorize("hasRole('ADMIN')")` sur le contrôleur.
- L'inscription crée toujours un compte `USER` ; le rôle n'est jamais choisi par le front.
- Le client d'une commande est déduit du token, jamais d'un paramètre.
- Côté front, tout texte venant de l'API est échappé avant affichage (protection XSS) et les redirections après connexion sont limitées aux pages du site.

**Commandes**
- Le front n'envoie que l'identifiant et la quantité : **le prix et le total sont recalculés par le serveur**.
- Le stock est vérifié puis décrémenté dans **une seule transaction** ; le produit est verrouillé (`PESSIMISTIC_WRITE`) pour éviter de vendre deux fois le même article.
- Chaque ligne conserve le nom et le prix au moment de l'achat : l'historique reste juste si le produit change ensuite.

**Données**
- Tables `users` et `orders` (et non `user`/`order`, mots réservés en SQL).
- Prix en `BigDecimal` pour éviter les erreurs d'arrondi.
- DTO sous forme de `record` Java : les entités ne sont jamais exposées directement.
- Requêtes avec `JOIN FETCH` / `@EntityGraph` pour éviter le problème des requêtes N+1.

**Front-end**
- Aucune dépendance ni étape de build : le dossier `frontend` se déploie tel quel.
- Le panier (localStorage) est resynchronisé avec l'API à l'ouverture : produits retirés, prix modifiés ou stock insuffisant sont signalés.
- Un bandeau prévient l'utilisateur quand l'API met du temps à répondre (réveil du serveur gratuit).
- Pages utilisables au clavier, adaptées au mobile, images de secours si une URL d'image est cassée.

---

## Problèmes fréquents

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| « Impossible de joindre le serveur » en local | API non démarrée | `mvn spring-boot:run` dans `backend` |
| Même message sur Vercel | `PROD_API_URL` non modifié ou sans `/api` | corriger `frontend/js/config.js` puis `git push` |
| Erreur CORS dans la console du navigateur | adresse du site non autorisée | ajuster `CORS_ALLOWED_ORIGINS` sur Render |
| Page blanche / erreurs en ouvrant les fichiers directement | adresse `file://` | servir le dossier (Live Server, `npx serve`...) |
| Déconnexion inattendue | token expiré (24 h) ou API redémarrée avec un autre secret | se reconnecter |
| Premier chargement très lent en ligne | API Render en veille | attendre le réveil (moins d'une minute) |
| Erreurs « cannot find symbol get... » dans l'IDE | Lombok non activé | installer le plugin Lombok et activer l'annotation processing |
| `Port 8080 already in use` | une autre application utilise le port | l'arrêter ou lancer avec `mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081` (et adapter `config.js`) |
