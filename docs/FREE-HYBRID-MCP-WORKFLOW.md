# SUNTREX - Mode "1 clic" (sans cout API)

Date: 2026-02-26  
Objectif: utiliser Codex + Claude avec un minimum de friction, sans API payante.

## Ce que fait ce mode

1. Prepare automatiquement un packet de review.
2. Copie le packet dans le presse-papiers.
3. Ouvre Claude.
4. Importe la reponse Claude et genere une todo list P0/P1/P2.

Tu gardes une intervention humaine minimale: coller la demande dans Claude et coller la reponse retour.

## Setup initial (une seule fois)

```bash
cd /Users/yohanaboujdid/Downloads/suntrex
chmod +x scripts/review_oneclick_export.sh scripts/review_oneclick_import.sh
```

## Usage rapide

### 1) Export vers Claude
```bash
npm run review:export
```
ou
```bash
./scripts/review_oneclick_export.sh --base origin/main
```

Puis dans Claude:
- Colle (Cmd+V).
- Envoie.
- Demande explicitement findings P0/P1/P2 avec fichiers/lignes.

### 2) Import retour Claude

Copie la reponse Claude, puis:
```bash
npm run review:import
```

Fichiers generes:
- `review/request.md`
- `review/response.md`
- `review/todo.md`

## Flux recommande

1. Codex implemente.
2. `npm run review:export`
3. Claude review.
4. `npm run review:import`
5. Codex corrige `review/todo.md` (P0/P1 d'abord).
6. Re-review si necessaire.
7. Merge.

## Etape auto "fix request" pour Codex

Apres import:
```bash
npm run review:fix
```

Ce que ca fait:
- lit `review/todo.md`
- extrait automatiquement les points P0/P1
- genere `review/codex_fix_request.md`
- copie la demande dans le presse-papiers

Tu n'as plus qu'a coller cette demande dans Codex.

## Notes

- Sur macOS, les scripts utilisent `pbcopy` / `pbpaste`.
- Sur Linux, ils essayent `xclip` ou `wl-copy/wl-paste`.
- Sans outil clipboard, utilise `--file` pour l'import.
