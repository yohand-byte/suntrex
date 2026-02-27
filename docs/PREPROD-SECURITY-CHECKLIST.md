# SUNTREX — Preprod Security Checklist

Checklist go/no-go pour valider la securite operationnelle avant ouverture preprod.

## 1) Secret handling (bloquant)

- [ ] Aucun secret hardcode dans le repo (API keys, webhook secrets, service role keys)
- [ ] Tous les secrets en variables d'environnement ou dans les variables n8n
- [ ] `.env*` exclus de Git

Verification rapide:

```bash
cd /Users/yohanaboujdid/Downloads/suntrex
rg -n "n8n_api_[A-Za-z0-9]{20,}" scripts netlify/functions docs src || true
rg -n "STRIPE_SECRET_KEY\\s*=\\s*['\\\"]sk_(live|test)_" scripts netlify/functions src || true
rg -n "STRIPE_WEBHOOK_SECRET\\s*=\\s*['\\\"]whsec_" scripts netlify/functions src || true
```

## 2) Webhook HTTPS + signature (bloquant)

- [ ] Endpoint Stripe configure en URL publique HTTPS
- [ ] Aucun endpoint `http://` ou `localhost` dans Stripe Dashboard (preprod/prod)
- [ ] `STRIPE_WEBHOOK_SECRET` configure dans n8n
- [ ] Toute signature invalide est rejetee et n'ecrit pas dans `Order`

Commandes de validation:

```bash
cd /Users/yohanaboujdid/Downloads/suntrex
npm run n8n:postcheck
/opt/homebrew/opt/node@22/bin/node scripts/validate-strict.mjs
```

Si test local uniquement, desactiver temporairement l'exigence HTTPS:

```bash
REQUIRE_HTTPS_WEBHOOK=false npm run n8n:postcheck
```

## 3) Rotation des secrets (execution)

Ordre recommande:

1. n8n API key
2. Stripe webhook secret
3. Supabase service_role key

### 3.1 Rotation n8n API key

```bash
cd /Users/yohanaboujdid/Downloads/suntrex
/opt/homebrew/opt/node@22/bin/node scripts/final-rotation.mjs
```

Le script:
- verifie n8n + workflows
- supprime les anciennes API keys n8n
- cree une nouvelle key
- met a jour `.mcp.json`

### 3.2 Rotation Stripe webhook secret

1. Stripe Dashboard -> Developers -> Webhooks -> endpoint SUNTREX
2. Click `Roll signing secret`
3. Copier le nouveau `whsec_...`
4. n8n -> Settings -> Variables -> `STRIPE_WEBHOOK_SECRET`

### 3.3 Rotation Supabase service_role key

1. Supabase -> Project Settings -> API
2. Rotate project JWT secret (regenere anon + service_role)
3. Mettre a jour `SUPABASE_SERVICE_ROLE_KEY` dans n8n Variables

### 3.4 Verification post-rotation

```bash
cd /Users/yohanaboujdid/Downloads/suntrex
npm run n8n:postcheck
/opt/homebrew/opt/node@22/bin/node scripts/validate-strict.mjs
```

## 4) Critere de sortie preprod

- [ ] `n8n:postcheck` passe sans FAIL
- [ ] `validate-strict.mjs` retourne exit code 0
- [ ] Webhook Stripe preprod est en HTTPS et actif
- [ ] Signature webhook validee et invalides journalisees
