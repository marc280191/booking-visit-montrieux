# Distillerie Montrieux — patch de custom app Shopify

Ce ZIP est un **patch à déposer sur une application Shopify générée avec le template officiel React Router**.

## Ce que contient le patch
- Interface admin de réservation
- API admin pour bloquer / débloquer / déplacer / annuler
- Route d'app proxy storefront pour les disponibilités
- Webhook `orders/paid` pour confirmer les réservations payées
- Schéma Prisma PostgreSQL
- Theme App Extension minimale pour un widget futur

## Pré-requis
1. Shopify CLI récent
2. Une app Shopify créée avec le template **React Router**
3. Une base PostgreSQL
4. Le produit Shopify **Visite et dégustation** déjà créé

## Installation rapide
```bash
shopify app init
# Choisir le template React Router
```

Ensuite, copiez le contenu de ce patch dans votre projet généré, en écrasant les fichiers si demandé.

## Variables d'environnement minimales
Créer un fichier `.env` avec :
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/montrieux_booking"
SHOPIFY_API_KEY="..."
SHOPIFY_API_SECRET="..."
SCOPES="read_products,read_orders,write_app_proxy"
SHOPIFY_APP_URL="https://votre-domaine-app.example.com"
```

## Commandes
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init_booking
npm run dev
```

## Mise en service
1. Démarrer l'app avec `npm run dev`
2. Installer l'app sur la boutique
3. Vérifier que l'app proxy fonctionne sur :
   `/apps/montrieux-booking/availability?date=2026-04-18&product_handle=visite-degustation`
4. Déployer l'app avec `shopify app deploy`
5. Dans le thème, publier la version fournie dans l'autre ZIP
6. Tester un achat réel sur le produit de visite

## Remarques
- Le webhook `orders/paid` confirme la réservation après paiement.
- Le front thème envoie les informations de réservation dans les propriétés de ligne du panier.
- Les créneaux sont générés automatiquement pour les 120 prochains jours.
