# SUNTREX Audit Complet (Marketplace B2B)

Date: 2026-02-26  
Scope: Produit, UI/UX, logique metier, securite, readiness pre-production FR

## 1. Executive Summary

SUNTREX dispose d'une base front solide (catalogue, dashboards, chat, support), mais le coeur marketplace reste majoritairement en mode demo.  
Le principal risque n'est pas le design: c'est la fiabilite transactionnelle (auth/KYC, controle prix, coherence data, paiements, audit trail).

Conclusion:
- Potentiel eleve.
- Non pret pour exploitation marketplace B2B en production.
- Priorite absolue: noyau transactionnel verifiable cote serveur.

## 2. Findings Majeurs

### P0 - Bloquants production

1) Controle d'acces KYC/prix principalement frontend
- Fichiers: `src/App.jsx`, `src/AuthSystem.jsx`, `src/components/catalog/PriceGate.jsx`
- Risque: contournement facile, fuite de logique metier.

2) Incoherence modele de donnees vs runtime
- Migrations: `supabase/migrations/20260225030000_enable_rls_all_tables.sql`
- Runtime: `src/hooks/useTransaction.js`, `src/hooks/useChat.js`, `api/messages/*`
- Risque: erreurs fonctionnelles et securite RLS fragile.

3) Flux marketplace core largement mockes
- Fichiers: `src/components/dashboard/dashboardUtils.js`, `src/components/dashboard/sell/MySales.jsx`, `src/components/dashboard/buy/BuyerRFQ.jsx`
- Risque: faux signal de maturite produit.

### P1 - Risques business forts

4) Stripe documente mais partiellement operationnel
- Fichier: `docs/STRIPE-ARCHITECTURE.md`
- Risque: echec de conversion et risque comptable.

5) Absence de socle tests metier
- Peu/pas de tests E2E et API critiques.
- Risque: regressions sur commandes/paiements/statuts.

6) Confiance marketplace insuffisamment materialisee dans les parcours
- Incoterms, SLA vendeur, litiges, preuves de livraison peu explicites.
- Risque: faible conversion B2B et faible retention.

## 3. Audit UI/UX (Marketplace)

## Forces
- Catalogue riche et recherche utile.
- Dashboards buyer/seller bien structures.
- Presence de chat transactionnel et support.

## Faiblesses
- Trop de composants base sur donnees mock.
- Le "trust layer" B2B est insuffisant dans l'UX:
  - preuve de verification vendeur,
  - regles de litige,
  - delais et fiabilite logistique.
- RFQ sous-exploite comme moteur principal de transactions B2B volume.

## 4. Logique Metier Marketplace: Cible

Acteurs:
- Buyer verifie KYC: voir prix, creer transaction, payer.
- Seller verifie KYB Stripe: publier offres, confirmer, expedier.

Regles:
- Etats transaction stricts:
  `negotiation -> confirmed -> paid -> shipped -> delivered -> completed/disputed`
- Verrouillage prix/quantite apres confirmation.
- Journal d'evenements immuable (audit trail).
- Detection et sanction des tentatives de paiement hors plateforme.

Scope sprint:
- France d'abord.
- TVA FR + intracom simplifiee.

## 5. IA: Bonne Idee?

Oui, mais apres stabilisation du core transactionnel.

Ordre recommande:
1. IA anti-fraude chat + risk scoring (ROI court terme).
2. IA normalisation catalogue (matching SKU, dedup, specs).
3. IA copilot RFQ/quote vendeur.
4. IA support operationnel connecte aux donnees commande.
5. IA pricing en dernier (quand data fiable suffisante).

## 6. KPIs Marketplace a suivre

- Taux KYC valide.
- Time-to-first-listing vendeur.
- Time-to-first-order buyer.
- Conversion RFQ -> quote -> transaction.
- Taux paiement reussi.
- Taux litige et delai moyen de resolution.
- GMV, take rate net, marge nette/transaction.

## 7. Go/No-Go Preprod FR

Go uniquement si:
- Auth/KYC/prix bloques cote serveur.
- Schéma data runtime unifie et RLS validees.
- Flux transaction + paiement Stripe testable end-to-end.
- Logs structurés + idempotence webhooks.
- Tests critiques passants (API + smoke E2E).

Sinon: No-Go.

