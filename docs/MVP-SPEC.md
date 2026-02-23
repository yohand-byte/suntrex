# SUNTREX — Spécifications MVP (Phase 1)

> Objectif : Lancer le plus vite possible avec un périmètre minimal viable.

---

## Périmètre MVP

### Ce qui est DANS le MVP

1. **Homepage** — Hero, recherche, catégories, produits vedettes, marques
2. **Catalogue** — Liste produits, filtres (marque, catégorie, puissance, dispo), regroupement par modèle
3. **Fiche produit** — Specs, photos, comparaison prix multi-vendeurs, datasheets
4. **Auth** — Inscription (email + SIRET + KYC doc), login, Google OAuth
5. **Prix masqués** — Visible uniquement après KYC validé par admin
6. **Paiements** — Stripe Connect, destination charges, commission plateforme
7. **Dashboard vendeur** — Gérer offres (CRUD), mes ventes
8. **Dashboard acheteur** — Mes achats, historique
9. **Chat basique** — Négociation acheteur-vendeur (texte, pas de fichiers)
10. **Multilingue** — FR + EN

### Ce qui N'EST PAS dans le MVP

- SUNTREX Delivery (Phase 2)
- Outils IA (Phase 3)
- Import xlsx en masse (Phase 2)
- App mobile (Phase 4)
- WhatsApp support (Phase 2)
- Traduction automatique chat (Phase 3)
- Recherche sémantique (Phase 3)

---

## Flux Utilisateur MVP

### Acheteur

```
Visiteur → Homepage → Catalogue → Fiche produit (prix masqués)
    ↓
Inscription (email + mdp + SIRET + TVA + document KYC)
    ↓
⏳ En attente validation (24h) — peut explorer, prix masqués
    ↓
✅ KYC validé → Prix visibles → Ajouter au panier → Paiement Stripe
    ↓
Commande confirmée → Chat avec vendeur → Livraison → Terminé
```

### Vendeur

```
Acheteur vérifié → Mon Profil → "Devenir vendeur"
    ↓
Vérification Stripe Connect KYB (identité, IBAN, TVA)
    ↓
⏳ Stripe vérifie (24-72h)
    ↓
✅ charges_enabled + payouts_enabled → Dashboard vendeur actif
    ↓
Ajouter offre → Prix, stock, entrepôt, livraison
    ↓
Offre visible catalogue → Acheteur commande → Chat → Paiement reçu
```

---

## Modèle de Données (Simplifié MVP)

### Users
```
id, email, password_hash, google_id,
company_name, siret, vat_number, country, address, city, postal_code, phone,
role (buyer | seller | both),
kyc_status (pending_review | verified | rejected),
kyc_document_url,
stripe_customer_id, stripe_account_id (sellers),
consent_cgv, consent_marketing, consent_partners,
created_at, updated_at
```

### Products (modèle produit unique)
```
id, name, brand, category, sku, ean,
description, specs (JSON), power, type, phases, mppt_count,
image_urls (JSON), datasheet_url,
created_at
```

### Offers (une offre = un vendeur propose un produit)
```
id, product_id, seller_id,
price_net, currency, moq (minimum order quantity),
stock_quantity, warehouse_location, warehouse_country,
delivery_time_days, delivery_price,
status (active | inactive | expired | draft),
expires_at, created_at, updated_at
```

### Orders
```
id, buyer_id, seller_id, offer_id,
quantity, unit_price, total_net, vat_amount, total_gross,
delivery_price, platform_fee,
stripe_payment_intent_id, stripe_transfer_id,
status (pending | paid | shipped | delivered | completed | cancelled | disputed),
shipping_address (JSON),
created_at, updated_at
```

### Messages (chat)
```
id, order_id, sender_id,
content, type (text | system),
created_at
```

---

## APIs MVP

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Inscription (email, mdp, company info) |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/google` | Google OAuth callback |
| GET | `/api/auth/me` | Profil utilisateur courant |
| POST | `/api/auth/kyc/upload` | Upload document KYC |

### Products & Offers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Liste produits (avec filtres) |
| GET | `/api/products/:id` | Détail produit + offres |
| POST | `/api/offers` | Créer une offre (seller) |
| PUT | `/api/offers/:id` | Modifier une offre |
| DELETE | `/api/offers/:id` | Supprimer une offre |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Créer une commande |
| GET | `/api/orders` | Mes commandes |
| GET | `/api/orders/:id` | Détail commande |
| PATCH | `/api/orders/:id/status` | Mettre à jour statut |

### Payments (Stripe)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stripe/create-payment-intent` | Créer un PaymentIntent |
| POST | `/api/stripe/webhook` | Webhook Stripe |
| POST | `/api/stripe/connect/onboarding` | Lien onboarding vendeur |
| GET | `/api/stripe/connect/status` | Statut compte connecté |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/:id/messages` | Messages d'une commande |
| POST | `/api/orders/:id/messages` | Envoyer un message |
| WS | `/ws/chat/:orderId` | WebSocket temps réel |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Liste utilisateurs |
| PATCH | `/api/admin/users/:id/kyc` | Valider/rejeter KYC |
| GET | `/api/admin/orders` | Toutes les commandes |
| GET | `/api/admin/dashboard` | Stats (GMV, commissions) |

---

## Vendeurs MVP (Lancement)

| Vendeur | Produits | Marques | Avantage prix |
|---------|----------|---------|---------------|
| Vendeur 1 | Onduleurs, batteries, optimiseurs | Huawei | Excellents prix |
| Vendeur 2 | Onduleurs, batteries | Deye | Très bons prix |
| Vendeur 3 (à recruter) | Panneaux solaires | Jinko/Trina/LONGi | Volume |

---

## Critères de Lancement MVP

- [ ] 3+ vendeurs avec offres actives
- [ ] 50+ produits listés
- [ ] Parcours acheteur complet testé (inscription → commande → paiement)
- [ ] Parcours vendeur complet testé (inscription → offre → vente → encaissement)
- [ ] Stripe Connect en mode live
- [ ] KYC admin fonctionnel
- [ ] Emails transactionnels (inscription, KYC, commande)
- [ ] SSL + domaine suntrex.com
- [ ] Mentions légales, CGV, politique de confidentialité
- [ ] Tests paiement 3D Secure
- [ ] Backup base de données automatique

---

*Spec MVP v1.0 — 23/02/2026*
