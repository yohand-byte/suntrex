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

Modes d'ouverture:
```bash
# Reutiliser un onglet Claude existant (par defaut)
npm run review:export

# Ne rien ouvrir (tu restes sur ton app/projet)
npm run review:export:noopen

# Ouvrir l'app mac Claude (si installee)
npm run review:export:app
```

Cibler un projet Claude precis:
```bash
# Option ponctuelle
./scripts/review_oneclick_export.sh --project-url "https://claude.ai/project/019c86a7-e2dc-72ce-b455-ed0e3ded1ea5"

# Option persistante (recommandee)
echo "https://claude.ai/project/019c86a7-e2dc-72ce-b455-ed0e3ded1ea5" > review/.claude_project_url
```

Le script essaie d'abord de reutiliser un onglet `claude.ai/project/...`, puis fallback sur n'importe quel onglet Claude.

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

## Mode sans retaper de commandes (autopilot)

Option 1 (terminal, une seule commande):
```bash
npm run review:auto
```

Option 2 (zero commande, double-clic):
- Double-clique `review.command` dans le dossier projet.

Ce mode:
1. exporte le packet,
2. attend que tu copies la reponse Claude,
3. lance automatiquement import + fix.

## Notes

- Sur macOS, les scripts utilisent `pbcopy` / `pbpaste`.
- Sur Linux, ils essayent `xclip` ou `wl-copy/wl-paste`.
- Sans outil clipboard, utilise `--file` pour l'import.
