# SUNTREX - Roadmap Parallele (Q2 2026)

Date de depart: 2026-03-02  
Regle de suivi: cocher `[x]` quand atteint, barrer la ligne obsolete.

## Stream A - Core Transactionnel (P0)

- [ ] 2026-03-02 -> 2026-03-03: migration schema runtime unifiee
- [ ] 2026-03-04: RLS complete sur tables runtime
- [ ] 2026-03-05: endpoint `GET /api/auth/me`
- [ ] 2026-03-06: endpoint `POST /api/transactions`
- [ ] 2026-03-07: endpoint `PATCH /api/transactions/:id/status`
- [ ] 2026-03-08: event journal `transaction_events` actif

## Stream B - Paiement Stripe (P0)

- [ ] 2026-03-04: `POST /api/stripe/create-payment-intent`
- [ ] 2026-03-05: webhook signature verification
- [ ] 2026-03-06: idempotence webhook (events dupliques ignores)
- [ ] 2026-03-07: mapping `confirmed -> paid` automatique
- [ ] 2026-03-08: stockage `payment_intent_id / charge_id / transfer_id`

## Stream C - UX Marketplace Trust (P1)

- [ ] 2026-03-05: carte vendeur trust (SLA, litiges, verification)
- [ ] 2026-03-06: timeline transaction orientee actions
- [ ] 2026-03-07: parcours RFQ priorise pour volume B2B
- [ ] 2026-03-08: microcopy TVA/incoterms/facture harmonisee

## Stream D - Moderation / Anti-Fraude (P1)

- [ ] 2026-03-06: detection bypass paiement enrichie
- [ ] 2026-03-07: scoring risque + raisons structurees
- [ ] 2026-03-08: UI signalement message flagged

## Stream E - QA / Metrics (P1)

- [ ] 2026-03-07: tests API critiques
- [ ] 2026-03-08: smoke flow complet FR
- [ ] 2026-03-09: dashboard KPI MVP (kyc_rate, payment_success_rate, dispute_rate)

## Jalons

- [ ] 2026-03-08: MVP transactionnel preprod READY
- [ ] 2026-03-09: Go/No-Go review
- [ ] 2026-03-10: preprod FR ouverte tests pilotes vendeurs

