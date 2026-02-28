-- ═══════════════════════════════════════════════════════════════
-- SUNTREX Sprint 1 — Auth + KYC Simplifié Schema
-- ═══════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Project: uigoadkslyztxgzahmwv
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. PROFILES TABLE ──────────────────────────────────────────
-- Extends auth.users with business-specific fields
-- Auto-created on signup via trigger

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('installer', 'distributor', 'integrator', 'wholesaler', 'other')),
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected', 'manual_review')),
  preferred_language TEXT DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'en', 'de', 'es', 'it', 'nl')),
  preferred_currency TEXT DEFAULT 'EUR' CHECK (preferred_currency IN ('EUR', 'GBP', 'CHF', 'PLN')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. COMPANIES TABLE ────────────────────────────────────────
-- One company per profile (1:1 for now, can be 1:many later)

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vat_number TEXT,
  vat_verified BOOLEAN DEFAULT FALSE,
  vat_company_name TEXT,        -- Name returned by VIES
  vat_address TEXT,             -- Address returned by VIES
  country TEXT NOT NULL CHECK (country IN ('FR', 'DE', 'BE', 'NL', 'IT', 'ES', 'AT', 'PT', 'PL', 'CH', 'LU')),
  stripe_account_id TEXT,       -- Stripe Connect account ID (for sellers)
  stripe_charges_enabled BOOLEAN DEFAULT FALSE,
  stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
  is_seller BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id)              -- 1 company per user for now
);

-- ─── 3. CONSENTS TABLE ────────────────────────────────────────
-- RGPD: track all consent events (append-only for audit trail)

CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('cgv_privacy', 'marketing_suntrex', 'marketing_partners')),
  granted BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast consent lookups
CREATE INDEX IF NOT EXISTS idx_consents_user_type ON public.consents(user_id, consent_type);

-- ─── 4. VAT VERIFICATION LOG ──────────────────────────────────
-- Audit trail for all VAT checks (compliance + debugging)

CREATE TABLE IF NOT EXISTS public.vat_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  vat_number TEXT NOT NULL,
  country_code TEXT NOT NULL,
  is_valid BOOLEAN NOT NULL,
  company_name TEXT,            -- From VIES response
  company_address TEXT,         -- From VIES response
  raw_response JSONB,           -- Full VIES API response
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. ROW LEVEL SECURITY ────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_verifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Companies: owner can CRUD, all authenticated can read (for marketplace)
CREATE POLICY "companies_select_all" ON public.companies
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "companies_insert_own" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "companies_update_own" ON public.companies
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Consents: users can read their own, insert their own (append-only, no delete)
CREATE POLICY "consents_select_own" ON public.consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "consents_insert_own" ON public.consents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- VAT verifications: read own (via company), insert via server only
CREATE POLICY "vat_select_own" ON public.vat_verifications
  FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  );

-- ─── 6. AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────
-- Trigger: when auth.users row is created, create a profiles row

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'installer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 7. AUTO-UPDATE updated_at ────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS companies_updated_at ON public.companies;
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── 8. HELPFUL VIEWS ─────────────────────────────────────────

-- Quick user+company view for the frontend
CREATE OR REPLACE VIEW public.user_with_company AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.phone,
  p.role,
  p.is_verified,
  p.kyc_status,
  p.preferred_language,
  p.preferred_currency,
  c.id AS company_id,
  c.name AS company_name,
  c.vat_number,
  c.vat_verified,
  c.country,
  c.is_seller,
  c.stripe_account_id
FROM public.profiles p
LEFT JOIN public.companies c ON c.owner_id = p.id;

-- ═══════════════════════════════════════════════════════════════
-- DONE. Run this in Supabase SQL Editor.
-- Then set environment variables:
--   VITE_SUPABASE_URL=https://uigoadkslyztxgzahmwv.supabase.co
--   VITE_SUPABASE_ANON_KEY=eyJ...
-- ═══════════════════════════════════════════════════════════════
