# SUNTREX Backlog d'Implementation (Sprint 1-2 semaines)

Date: 2026-02-26  
Objectif: fiabilite transactionnelle marketplace B2B (France d'abord)

## Epic A - Data model runtime unique

Priorite: P0  
Definition of done:
- Tables runtime unifiees:
  `profiles`, `companies`, `listings`, `transactions`, `transaction_items`, `messages`, `message_attachments`, `moderation_logs`, `rfqs`, `quotes`, `transaction_events`
- Enums:
  `kyc_status`, `transaction_status`, `listing_status`
- Contraintes:
  `price > 0`, `qty >= 1`, `stock >= 0`
- RLS coherentes par role/participant.

## Epic B - Auth/KYC server-first

Priorite: P0  
Definition of done:
- Endpoint `GET /api/auth/me`
- Reponse:
  `{ user_id, role, kyc_status, company_id, country }`
- Middleware API centralise:
  - session valide
  - controle `kyc_status=verified` pour prix et creation transaction

## Epic C - Transaction flow minimal reel

Priorite: P0  
Definition of done:
- Endpoint `POST /api/transactions` (listing + qty + address)
- Endpoint `GET /api/transactions/:id`
- Endpoint `PATCH /api/transactions/:id/status` avec transitions strictes
- Endpoint `POST /api/transactions/:id/items`
- Audit `transaction_events` obligatoire sur changements.

## Epic D - Paiement Stripe Connect fiable

Priorite: P0  
Definition of done:
- Endpoint `POST /api/stripe/create-payment-intent` (recalcul serveur)
- Endpoint `POST /api/stripe/webhook` (signature + idempotence)
- Mapping statuts Stripe -> transaction
- Stockage IDs Stripe:
  `payment_intent_id`, `charge_id`, `transfer_id`

## Epic E - Moderation anti-contournement

Priorite: P1  
Definition of done:
- `api/messages/send` reste point unique d'envoi
- Detection enrichie hors-plateforme (coordonnees/paiement externe)
- Logging `moderation_logs`
- Signalement visible en UI transaction

## Epic F - Observabilite et garde-fous

Priorite: P1  
Definition of done:
- Logs structures API:
  `request_id`, `user_id`, `transaction_id`, `event_type`
- Metriques MVP:
  kyc_rate, conversion_verified_to_first_tx, payment_success_rate, dispute_rate
- Headers securite complets deploy

## Tests d'acceptation minimum

1) User non verifie:
- ne peut pas voir prix via API
- ne peut pas creer transaction

2) Buyer verifie:
- peut creer transaction
- seller confirme
- paiement => statut `paid`

3) Verrouillage apres confirmation:
- modification prix refusee

4) Moderation:
- message off-platform => flagged + log

5) RLS:
- non participant transaction => acces refuse messages/transaction

6) Webhook:
- signature invalide refusee
- evenement duplique ignore (idempotence)

