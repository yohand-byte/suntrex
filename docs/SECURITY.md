# SUNTREX — Politique de Sécurité

---

## Principes

1. **Security-first** — La sécurité n'est pas optionnelle, elle est dans le design
2. **Zero trust client** — Ne jamais faire confiance aux données côté client
3. **Least privilege** — Chaque composant n'accède qu'à ce dont il a besoin
4. **Defense in depth** — Plusieurs couches de protection

---

## Authentification & KYC

### Inscription
- Email + mot de passe (min 8 caractères, hashé bcrypt/argon2)
- Google OAuth (alternative)
- SIRET/SIREN vérifié via API gouvernementale (FR)
- TVA intracommunautaire obligatoire
- Document KYC obligatoire (Kbis, attestation TVA, RGE, facture fournisseur)
- **Aucun skip possible** — document requis pour tous les rôles

### Validation KYC
- **Jamais automatique** — un admin humain valide chaque dossier
- Vérification croisée : SIRET ↔ nom entreprise ↔ document
- Rejet avec motif explicite si incohérence
- Délai max 24h ouvrées

### Accès après inscription
| État | Peut explorer | Voit les prix | Peut commander | Peut vendre |
|------|:---:|:---:|:---:|:---:|
| Inscrit, KYC en attente | ✅ | ❌ | ❌ | ❌ |
| KYC validé (acheteur) | ✅ | ✅ | ✅ | ❌ |
| KYC validé + Stripe KYB | ✅ | ✅ | ✅ | ✅ |

---

## Paiements (Stripe)

Voir [STRIPE-ARCHITECTURE.md](STRIPE-ARCHITECTURE.md) pour les détails complets.

Règles critiques :
- Clés API en variables d'environnement uniquement
- Vérification signature webhook obligatoire
- Idempotency keys sur toutes les opérations financières
- Recalcul montant côté serveur (ne jamais utiliser le montant envoyé par le client)
- 3D Secure / SCA obligatoire (Europe)

---

## Protection des Données (RGPD)

### Consentement
- 3 checkboxes à l'inscription :
  1. CGV + politique de confidentialité (obligatoire)
  2. Marketing SUNTREX (optionnel)
  3. Marketing partenaires (optionnel)
- Consentement horodaté et stocké en base
- Possibilité de retrait à tout moment (Mon Profil)

### Données collectées
| Donnée | Finalité | Base légale | Rétention |
|--------|----------|-------------|-----------|
| Email, mot de passe | Authentification | Contrat | Durée du compte |
| SIRET, TVA, raison sociale | Vérification B2B | Obligation légale | 10 ans (comptabilité) |
| Document KYC | Vérification identité | Intérêt légitime | 5 ans après fermeture |
| Historique commandes | Service | Contrat | 10 ans (comptabilité) |
| Messages chat | Médiation litiges | Intérêt légitime | 3 ans |
| Adresse IP, logs | Sécurité | Intérêt légitime | 1 an |

### Droits des utilisateurs
- Accès à ses données (export JSON)
- Rectification
- Suppression (sauf obligations légales)
- Portabilité
- Opposition au profilage

---

## Modération & Anti-fraude

### Chat
- Modération IA temps réel (Phase 3)
- Modérateurs humains formés au B2B solaire
- Détection tentatives de paiement hors plateforme
- Filtre coordonnées personnelles prématurées
- Charte de conduite obligatoire

### Anti-fraude
- Détection comptes multiples (fingerprinting, IP, device)
- Détection prix anormalement bas (dumping) ou élevés
- Monitoring patterns : commandes fictives, annulations répétées
- Sanctions graduées : avertissement → suspension → bannissement

### Gestion des litiges
- Preuves horodatées (photos, GPS, chat, paiements)
- Médiation admin avant escalade Stripe
- SUNTREX Delivery = preuves supplémentaires (QR, photos, signature)

---

## Infrastructure

### Preprod readiness
- Checklist operationnelle: `docs/PREPROD-SECURITY-CHECKLIST.md`
- Rotation secrete + verification: `scripts/final-rotation.mjs`, `npm run n8n:postcheck`, `scripts/validate-strict.mjs`

### Secrets
```
.env                    → JAMAIS commité (dans .gitignore)
Variables Vercel         → Secrets chiffrés
Variables Netlify        → Secrets chiffrés
```

### Headers de sécurité (vercel.json)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    }
  ]
}
```

### Backups
- Base de données : backup automatique quotidien
- Documents KYC : réplication multi-zone (S3/R2)
- Logs Stripe : conservation 2 ans minimum

---

## .gitignore (obligatoire)

```
.env
.env.local
.env.production
node_modules/
dist/
*.pem
*.key
```

---

*Security Policy v1.0 — 23/02/2026*
