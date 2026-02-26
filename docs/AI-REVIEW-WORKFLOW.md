# SUNTREX - AI Review Workflow (Codex + Claude Opus)

Date: 2026-02-26  
Objectif: avancer plus vite et plus intelligemment sans perdre le controle produit.

## 1) Principe

- Codex implemente.
- Claude Opus critique.
- Codex corrige.
- Toi tu valides le gate final.

Ce workflow est un "pair reviewer IA", pas un pilote automatique.

## 2) Roles

### Codex
- Produit le code.
- Explique ses choix.
- Integre les corrections demandees.

### Claude Opus
- Fait une revue critique orientee risques.
- Classe les findings en P0/P1/P2.
- Donne des corrections concretes.

### Toi (owner)
- Arbitre les compromis.
- Valide ou refuse les changements P0/P1.
- Donne le GO merge.

## 3) Standard de review obligatoire

Chaque review Claude doit couvrir:
1. Securite (auth, permissions, secrets, injections).
2. Logique metier marketplace (transactions, statuts, KYC/KYB, paiements).
3. Fiabilite (idempotence, concurrence, edge cases).
4. Regressions potentielles.
5. Tests manquants.

Format de sortie attendu:
- Finding
- Severite (P0/P1/P2)
- Impact metier
- Fichier + ligne
- Correction proposee

## 4) Gates de merge

## Gate A - Pre-review
- Build passe.
- Diff lisible.
- Objectif de la PR explicite.

## Gate B - Review IA
- Aucun P0 ouvert.
- P1 justifies si reportes.

## Gate C - Validation owner
- Comportement metier conforme.
- Risques acceptables.
- GO merge.

## 5) Prompt type pour Claude (review)

```text
Tu es reviewer principal sur une marketplace B2B.
Analyse ce diff avec priorite sur:
1) securite
2) logique metier transactionnelle
3) paiements/Stripe/idempotence
4) RLS et controle d'acces
5) tests manquants

Donne un rapport strict:
- P0/P1/P2
- impact metier
- fichier + ligne
- correction proposee

Pas de blabla. Pas de generalites.
```

## 6) Prompt type pour Codex (correction)

```text
Applique uniquement les corrections suivantes issues de la review:
[colle la liste P0/P1]

Contraintes:
- ne casse pas les parcours existants
- ajoute les tests minimaux associes
- explique chaque correction en 1 ligne
```

## 7) Anti-patterns a eviter

- Merge base uniquement sur "ca a l'air bon".
- Accepter une review sans preuves (pas de ligne/fichier).
- Corriger tout en une fois sans prioriser les P0.
- Laisser des P0 "temporairement" en prod.

## 8) Utilisation cible sur SUNTREX

- Transactions/status machine.
- Stripe webhook + idempotence.
- KYC gate server-side.
- RLS Supabase.
- Moderation anti bypass paiement.

