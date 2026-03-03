# SUNTREX — TASKS (Strict)

Status legend: TODO · IN_PROGRESS · DONE · BLOCKED

---

## STX-001 — Robots + Sitemap cleanup
- **Owner:** Codex
- **Status:** TODO
- **Depends on:** none
- **Objectif:** Empêcher l’indexation des routes privées et garder un sitemap public propre.
- **Scope fichiers autorisés:**
  - `public/robots.txt`
  - `public/sitemap.xml`
  - `HANDOFF.md`
- **Critères d’acceptation:**
  - `robots.txt` inclut `Disallow: /auth` et `Disallow: /dashboard`
  - `sitemap.xml` n’inclut pas `/auth` ni `/dashboard`
  - XML valide et accessible

## STX-003 — Route-level lazy loading
- **Owner:** Codex
- **Status:** TODO
- **Depends on:** STX-001 (recommended order)
- **Objectif:** Réduire le bundle initial et accélérer le premier chargement.
- **Scope fichiers autorisés:**
  - `src/App.(js|jsx|ts|tsx)`
  - `src/main.(js|jsx|ts|tsx)`
  - `src/routes.(js|jsx|ts|tsx)`
  - `src/pages/**`
  - `src/components/**`
  - `HANDOFF.md`
- **Critères d’acceptation:**
  - Routes non critiques chargées en lazy
  - Home stable (pas de régression UX)
  - Navigation sans erreurs runtime

## STX-005 — Hero CRO block
- **Owner:** Codex
- **Status:** TODO
- **Depends on:** none
- **Objectif:** Augmenter le CTR des CTA en home.
- **Scope fichiers autorisés:**
  - `src/pages/HomePage.(js|jsx|ts|tsx)`
  - `src/components/**`
  - `src/i18n/**`
  - `src/locales/**`
  - `HANDOFF.md`
- **Critères d’acceptation:**
  - CTA principal + secondaire visibles above-the-fold
  - 3 points de confiance affichés
  - Responsive mobile/desktop OK

## STX-007 — Dynamic metadata per route
- **Owner:** Codex
- **Status:** TODO
- **Depends on:** STX-001
- **Objectif:** Metadonnées SEO par route publique.
- **Scope fichiers autorisés:**
  - `index.html`
  - `src/seo/**`
  - `src/routes/**`
  - `src/pages/**`
  - `src/App.(js|jsx|ts|tsx)`
  - `src/components/**`
  - `public/**`
  - `HANDOFF.md`
- **Critères d’acceptation:**
  - Title/description/canonical/OG pour `/`, `/catalog`, `/blog`, `/faq`
  - Pas de canonical incohérent

## STX-009 — JSON-LD schema integration
- **Owner:** Codex
- **Status:** TODO
- **Depends on:** STX-007
- **Objectif:** Ajouter structured data valide pour rich results.
- **Scope fichiers autorisés:**
  - `src/seo/**`
  - `src/pages/**`
  - `src/components/**`
  - `public/**`
  - `HANDOFF.md`
- **Critères d’acceptation:**
  - JSON-LD `Organization` + `WebSite`
  - `Product` si page produit existe
  - JSON-LD valide (pas d’erreurs bloquantes)

## STX-011 — Mobile sticky CTA
- **Owner:** Codex
- **Status:** TODO
- **Depends on:** STX-005
- **Objectif:** Améliorer conversion mobile.
- **Scope fichiers autorisés:**
  - `src/pages/**`
  - `src/components/**`
  - `src/styles/**`
  - `HANDOFF.md`
- **Critères d’acceptation:**
  - CTA sticky visible mobile
  - Aucun overlap nav/footer
  - Pas de saut layout majeur

## STX-013 — Analytics funnel events
- **Owner:** Codex
- **Status:** TODO
- **Depends on:** STX-005, STX-011
- **Objectif:** Mesurer le funnel conversion de base.
- **Scope fichiers autorisés:**
  - `src/analytics/**`
  - `src/tracking/**`
  - `src/lib/**`
  - `src/utils/**`
  - `src/pages/**`
  - `src/components/**`
  - `HANDOFF.md`
- **Critères d’acceptation:**
  - Events: `hero_cta_click`, `catalog_filter_used`, `product_view`, `signup_start`, `signup_complete`
  - Pas de PII dans payload
  - Events déclenchés sur actions réelles
