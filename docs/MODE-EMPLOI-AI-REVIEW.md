# Mode d'emploi simple - Codex + Claude (pour toi)

Date: 2026-02-26  
But: aller vite, garder la qualite, eviter les erreurs critiques.

## Routine simple en 6 etapes

1. Tu donnes une tache claire a Codex  
Exemple: "implemente endpoint /api/auth/me avec gate KYC."

2. Codex code et te donne le diff  
Tu verifies vite fait l'intention.

3. Tu envoies le diff a Claude pour critique  
Utilise le prompt de review dans `docs/AI-REVIEW-WORKFLOW.md`.

4. Tu recuperes les findings P0/P1  
Ignore le bruit, garde seulement les points concrets.

5. Tu redonnes ces points a Codex  
Exemple: "corrige ces P0/P1 + ajoute tests minimaux."

6. Tu valides et pushes  
Regle: pas de merge si P0 ouvert.

## Regles d'or

- P0 = bloquant merge.
- P1 = corriger maintenant ou documenter pourquoi reporte.
- Toujours demander fichier + ligne + impact metier.
- Pour paiement/auth/RLS: validation manuelle obligatoire.

## Quand utiliser ce workflow

Toujours pour:
- auth
- KYC/KYB
- transactions
- Stripe
- RLS

Optionnel pour:
- UI cosmetique
- copywriting
- refactor mineur sans impact metier

## Template message ultra simple (copier/coller)

### A Codex (debut)
```text
Implementer: [objectif]
Contrainte: ne pas casser l'existant
Sortie attendue: code + tests + resume court
```

### A Claude (review)
```text
Review critique ce diff.
Priorite: securite, logique metier marketplace, paiements, RLS, tests manquants.
Format: P0/P1/P2 + impact + fichier/ligne + correction.
```

### A Codex (correction)
```text
Corrige uniquement ces findings P0/P1:
[colle la liste]
Ajoute les tests minimaux associes.
```

