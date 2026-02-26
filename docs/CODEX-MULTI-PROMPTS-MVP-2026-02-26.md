# SUNTREX - Multi Prompts Codex (MVP)

Date: 2026-02-26  
Usage: copier/coller chaque prompt dans une session Codex dediee par stream.

## Prompt 1 - Core Marketplace Backend (P0)

```text
Contexte:
Projet SUNTREX (marketplace B2B solaire). Scope France d'abord. Priorite fiabilite transactionnelle.

Mission:
Implementer le noyau backend MVP en server-first.

Objectifs:
1) Unifier le schema runtime Supabase: profiles, companies, listings, transactions, transaction_items, messages, message_attachments, moderation_logs, rfqs, quotes, transaction_events.
2) Ajouter enums: kyc_status, transaction_status, listing_status.
3) Ajouter contraintes (price > 0, qty >= 1, stock >= 0) + FK + RLS strictes.
4) Implementer endpoints:
   - GET /api/auth/me
   - POST /api/transactions
   - GET /api/transactions/:id
   - PATCH /api/transactions/:id/status
   - POST /api/transactions/:id/items
5) Logger transaction_events sur chaque mutation.

Contraintes:
- Ne pas casser le fallback demo en dev.
- Aucun controle d'acces uniquement frontend.
- Toujours verifier participant/role cote serveur.

Definition of Done:
- Migrations SQL propres.
- Endpoints fonctionnels.
- Flux negotiation -> confirmed valide.
- Documentation API mise a jour.
```

## Prompt 2 - Stripe Connect Paiement Fiable

```text
Contexte:
SUNTREX B2B marketplace, Stripe Connect destination charges.

Mission:
Rendre le flux paiement testable de bout en bout (mode test Stripe).

Objectifs:
1) POST /api/stripe/create-payment-intent (input: transaction_id uniquement).
2) Recalcul montant cote serveur (jamais confiance client).
3) Webhook /api/stripe/webhook avec verification signature.
4) Idempotence stricte (event id + storage).
5) Mapping statuts payment_intent -> transaction.status.
6) Stocker payment_intent_id, charge_id, transfer_id.

Contraintes:
- PSD2/SCA compatible.
- Logs structures (request_id, tx_id, event_type).

Definition of Done:
- Paiement test Stripe passe confirmed -> paid.
- Doublons webhook ignores.
- Signature invalide rejetee.
```

## Prompt 3 - UI/UX Marketplace Trust Layer

```text
Contexte:
SUNTREX veut une UX de marketplace B2B premium, orientee confiance et conversion.

Mission:
Refondre les ecrans transaction/catalog/dashboard pour rendre la confiance explicite.

Objectifs UX:
1) Afficher preuves de confiance vendeur (KYC/KYB, SLA, taux litige, delai moyen).
2) Clarifier statuts transaction et prochaines actions attendues.
3) RFQ first pour gros volumes (CTA principal B2B).
4) Progressive disclosure (details techniques, fiscalite, incoterms).
5) Microcopy B2B claire (TVA, factures, compliance).

Contraintes design:
- Premium dark UI, glassmorphism, 8px grid, responsive, no generic AI look.
- Animations discretes et utiles.

Definition of Done:
- Parcours buyer et seller plus court vers first transaction.
- Ecrans coherents avec logique metier reelle.
```

## Prompt 4 - Moderation / Anti-Fraude Chat

```text
Contexte:
Le chat transactionnel existe deja via Supabase + API messages.

Mission:
Renforcer la detection anti-contournement de paiement hors plateforme.

Objectifs:
1) Enrichir patterns de moderation (coordonnees, canaux externes, intentions de bypass).
2) Ajouter score de risque et raisons explicites.
3) Journaliser dans moderation_logs.
4) UI: signaler message flagged + workflow review admin minimal.

Contraintes:
- Faux positifs limites.
- Aucune fuite de donnees sensibles.

Definition of Done:
- Messages a risque sont detectes, traces, visibles.
- Aucun envoi hors route API centrale.
```

## Prompt 5 - QA & Metrics MVP

```text
Contexte:
Aucun socle de tests metier robuste actuellement.

Mission:
Mettre en place une QA MVP orientee risques marketplace.

Objectifs:
1) Tests API critiques:
   - auth/me
   - create transaction (kyc verified obligatoire)
   - status transitions
   - stripe webhook signature/idempotence
2) Smoke E2E:
   register -> kyc verified -> order -> pay -> chat -> status update
3) KPIs:
   - kyc_rate
   - verified_to_first_tx
   - payment_success_rate
   - dispute_rate

Definition of Done:
- Suite de tests executables en CI.
- Tableau metriques minimal disponible.
```

