-- ============================================================
-- SUNTREX Sprint 1 — Additive Auth Enhancement
-- Date: 2026-02-28
-- Purpose: Add RGPD consents, VAT audit trail, auto-profile
--          trigger, and user_with_company convenience view.
--          SAFE to run on existing runtime_marketplace_baseline.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ADD MISSING COLUMNS TO profiles (IF NOT EXISTS pattern)
-- ------------------------------------------------------------
DO $$
BEGIN
  -- Personal info columns for auth flow
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='first_name') THEN
    ALTER TABLE public.profiles ADD COLUMN first_name TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_name') THEN
    ALTER TABLE public.profiles ADD COLUMN last_name TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='preferred_language') THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_language TEXT DEFAULT 'fr';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='preferred_currency') THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_currency TEXT DEFAULT 'EUR';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_login_at') THEN
    ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2. ADD MISSING COLUMNS TO companies
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='vat_verified') THEN
    ALTER TABLE public.companies ADD COLUMN vat_verified BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='vat_company_name') THEN
    ALTER TABLE public.companies ADD COLUMN vat_company_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='vat_address') THEN
    ALTER TABLE public.companies ADD COLUMN vat_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='is_seller') THEN
    ALTER TABLE public.companies ADD COLUMN is_seller BOOLEAN DEFAULT FALSE;
  END IF;
  -- Alias: owner_id → owner_user_id already exists, Sprint 1 hook uses owner_id
  -- We handle this in the view below
END $$;

-- ------------------------------------------------------------
-- 3. CONSENTS TABLE (RGPD audit trail — append-only)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('cgv_privacy', 'marketing_suntrex', 'marketing_partners')),
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address TEXT,
  user_agent TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick user lookups
CREATE INDEX IF NOT EXISTS idx_consents_user_id ON public.consents(user_id);

-- RLS: users can only read/insert their own consents, NEVER delete (audit trail)
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'consents_select_own') THEN
    CREATE POLICY consents_select_own ON public.consents
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'consents_insert_own') THEN
    CREATE POLICY consents_insert_own ON public.consents
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 4. VAT VERIFICATIONS TABLE (audit log)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vat_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vat_number TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT '',
  is_valid BOOLEAN,
  company_name TEXT,
  company_address TEXT,
  raw_response JSONB,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vat_verif_user ON public.vat_verifications(user_id);

ALTER TABLE public.vat_verifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vat_verif_select_own') THEN
    CREATE POLICY vat_verif_select_own ON public.vat_verifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vat_verif_insert_own') THEN
    CREATE POLICY vat_verif_insert_own ON public.vat_verifications
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 5. AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.company_role, 'buyer')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.profiles.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.profiles.last_name);
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 6. CONVENIENCE VIEW: user + company joined
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.user_with_company AS
SELECT
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.phone,
  p.company_name,
  p.country_code AS country,
  p.role,
  p.kyc_status,
  p.is_verified,
  p.vat_number,
  p.vat_verified,
  p.preferred_language,
  p.preferred_currency,
  p.last_login_at,
  p.avatar_url,
  p.rating,
  p.created_at,
  c.id AS company_id,
  c.legal_name AS company_legal_name,
  c.vat_company_name,
  c.vat_address,
  c.stripe_account_id,
  c.stripe_charges_enabled,
  c.stripe_payouts_enabled,
  c.is_seller,
  c.siret
FROM public.profiles p
LEFT JOIN public.companies c ON c.owner_user_id = p.id;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.user_with_company TO authenticated;

-- ============================================================
-- DONE. Sprint 1 auth enhancement applied.
-- Tables added: consents, vat_verifications
-- Columns added: profiles(email, first_name, last_name, phone, etc.)
-- Trigger: auto-create profile on signup
-- View: user_with_company for easy frontend queries
-- ============================================================
