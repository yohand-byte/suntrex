-- ═══ 1. Trigger: auto-create profile on signUp ═══
-- profiles: PK = id (not user_id), country_code (not country), role default 'buyer'
-- Company: camelCase (Prisma), no FK to auth.users — skip auto-insert

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone, preferred_language, preferred_currency, role, country_code, company_name, vat_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'fr'),
    COALESCE(NEW.raw_user_meta_data->>'preferred_currency', 'EUR'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
    COALESCE(NEW.raw_user_meta_data->>'country', 'FR'),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'vat_number', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Company table uses camelCase (Prisma) and has no user_id FK
  -- Sellers create their Company during seller onboarding flow

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══ 2. Table consents (RGPD) ═══
CREATE TABLE IF NOT EXISTS public.consents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cgv_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  marketing_suntrex_at timestamptz,
  marketing_partners_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own consents" ON public.consents;
CREATE POLICY "Users read own consents" ON public.consents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own consents" ON public.consents;
CREATE POLICY "Users insert own consents" ON public.consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own consents" ON public.consents;
CREATE POLICY "Users update own consents" ON public.consents
  FOR UPDATE USING (auth.uid() = user_id);

-- ═══ 3. Grant access ═══
GRANT SELECT, INSERT, UPDATE ON public.consents TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
