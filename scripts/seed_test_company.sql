-- ══════════════════════════════════════════════════════════════
-- seed_test_company.sql — SUNTREX
-- Crée une Company de test liée à un user Supabase existant.
-- Usage: Coller dans Supabase → SQL Editor → Run
--
-- AVANT D'EXÉCUTER:
--   Remplace 'REMPLACE_PAR_TON_EMAIL@exemple.com' par ton email réel
-- ══════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_user_id    uuid;
  v_company_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'REMPLACE_PAR_TON_EMAIL@exemple.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User introuvable. Vérifie que le compte existe dans Supabase Auth.';
  END IF;

  RAISE NOTICE 'User trouvé: %', v_user_id;

  SELECT id INTO v_company_id
  FROM "Company"
  WHERE owner_id = v_user_id
  LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    RAISE NOTICE 'Company déjà existante (id: %) — aucune action.', v_company_id;
    RETURN;
  END IF;

  INSERT INTO "Company" (
    id, owner_id, name, country, vat_number, kyc_status, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), v_user_id, 'Test Solar SAS', 'FR', 'FR12345678901',
    'not_started', now(), now()
  )
  RETURNING id INTO v_company_id;

  RAISE NOTICE 'Company créée (id: %)', v_company_id;
END $$;

-- Vérification
SELECT c.id, c.name, c.country, c.kyc_status, c.stripe_account_id, u.email
FROM "Company" c
JOIN auth.users u ON u.id = c.owner_id
WHERE u.email = 'REMPLACE_PAR_TON_EMAIL@exemple.com';
