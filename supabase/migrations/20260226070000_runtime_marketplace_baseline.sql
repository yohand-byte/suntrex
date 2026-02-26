-- ============================================================
-- SUNTREX Runtime Marketplace Baseline
-- Date: 2026-02-26
-- Goal: unify runtime schema used by frontend/api + strict RLS
-- Scope: France-first MVP, transaction reliability
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE public.kyc_status AS ENUM ('pending_review', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.transaction_status AS ENUM (
    'negotiation', 'confirmed', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.listing_status AS ENUM ('draft', 'active', 'inactive', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.company_role AS ENUM ('buyer', 'seller', 'both');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------
-- CORE TABLES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  company_name TEXT NOT NULL DEFAULT '',
  country_code TEXT NOT NULL DEFAULT 'FR',
  role public.company_role NOT NULL DEFAULT 'buyer',
  kyc_status public.kyc_status NOT NULL DEFAULT 'pending_review',
  avatar_url TEXT,
  badges TEXT[] DEFAULT '{}',
  vat_number TEXT,
  vat_verified BOOLEAN NOT NULL DEFAULT FALSE,
  vat_verified_at TIMESTAMPTZ,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  transactions_completed INTEGER NOT NULL DEFAULT 0,
  active_offers INTEGER NOT NULL DEFAULT 0,
  avg_response_time_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  role public.company_role NOT NULL DEFAULT 'buyer',
  country_code TEXT NOT NULL DEFAULT 'FR',
  vat_number TEXT,
  siret TEXT,
  stripe_account_id TEXT,
  stripe_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price > 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  stock INTEGER NOT NULL CHECK (stock >= 0),
  moq INTEGER NOT NULL DEFAULT 1 CHECK (moq >= 1),
  lead_time_days INTEGER NOT NULL DEFAULT 3 CHECK (lead_time_days >= 0),
  status public.listing_status NOT NULL DEFAULT 'draft',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  status public.transaction_status NOT NULL DEFAULT 'negotiation',
  currency TEXT NOT NULL DEFAULT 'EUR',
  locked_unit_price NUMERIC(12,2) CHECK (locked_unit_price > 0),
  subtotal_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_address_id UUID,
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_intent_id TEXT,
  charge_id TEXT,
  transfer_id TEXT,
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  disputed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty >= 1),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price > 0),
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (vat_rate >= 0),
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (qty * unit_price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('buyer', 'seller', 'system')),
  body TEXT NOT NULL CHECK (length(trim(body)) > 0),
  original_lang TEXT DEFAULT 'fr',
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'blocked')),
  moderation_score NUMERIC(4,3),
  moderation_flags TEXT[] DEFAULT '{}',
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT,
  score NUMERIC(4,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  qty INTEGER NOT NULL CHECK (qty >= 1),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'awarded', 'cancelled')),
  deadline_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price > 0),
  qty INTEGER NOT NULL CHECK (qty >= 1),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- FK REPAIR / ALIGNMENT
-- ------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON public.profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_companies_role ON public.companies(role);
CREATE INDEX IF NOT EXISTS idx_listings_seller_status ON public.listings(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON public.transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON public.transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_messages_tx_created ON public.messages(transaction_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_attachments_msg ON public.message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_tx ON public.moderation_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_buyer_status ON public.rfqs(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_rfq_seller ON public.quotes(rfq_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_tx_events_tx_created ON public.transaction_events(transaction_id, created_at);

-- ------------------------------------------------------------
-- HELPERS
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.* FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_verified_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT p.kyc_status = 'verified'::public.kyc_status FROM public.profiles p WHERE p.id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_tx_participant(tx_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.transactions t
    WHERE t.id = tx_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- TRIGGERS
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_listings_updated_at ON public.listings;
CREATE TRIGGER trg_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_transaction_items_updated_at ON public.transaction_items;
CREATE TRIGGER trg_transaction_items_updated_at
BEFORE UPDATE ON public.transaction_items
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_messages_updated_at ON public.messages;
CREATE TRIGGER trg_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_rfqs_updated_at ON public.rfqs;
CREATE TRIGGER trg_rfqs_updated_at
BEFORE UPDATE ON public.rfqs
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_quotes_updated_at ON public.quotes;
CREATE TRIGGER trg_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------
-- RLS ENABLE
-- ------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_events ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- RLS POLICIES - profiles
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------
-- RLS POLICIES - companies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "companies_select_authenticated" ON public.companies;
CREATE POLICY "companies_select_authenticated"
  ON public.companies FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "companies_insert_owner" ON public.companies;
CREATE POLICY "companies_insert_owner"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "companies_update_owner" ON public.companies;
CREATE POLICY "companies_update_owner"
  ON public.companies FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- ------------------------------------------------------------
-- RLS POLICIES - listings
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "listings_select_active_authenticated" ON public.listings;
CREATE POLICY "listings_select_active_authenticated"
  ON public.listings FOR SELECT TO authenticated
  USING (status = 'active'::public.listing_status OR seller_id = auth.uid());

DROP POLICY IF EXISTS "listings_insert_verified_seller" ON public.listings;
CREATE POLICY "listings_insert_verified_seller"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND public.is_verified_user()
  );

DROP POLICY IF EXISTS "listings_update_owner" ON public.listings;
CREATE POLICY "listings_update_owner"
  ON public.listings FOR UPDATE TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "listings_delete_owner" ON public.listings;
CREATE POLICY "listings_delete_owner"
  ON public.listings FOR DELETE TO authenticated
  USING (seller_id = auth.uid());

-- ------------------------------------------------------------
-- RLS POLICIES - transactions
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "transactions_select_participant" ON public.transactions;
CREATE POLICY "transactions_select_participant"
  ON public.transactions FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "transactions_insert_verified_buyer" ON public.transactions;
CREATE POLICY "transactions_insert_verified_buyer"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (
    buyer_id = auth.uid()
    AND public.is_verified_user()
  );

DROP POLICY IF EXISTS "transactions_update_participant" ON public.transactions;
CREATE POLICY "transactions_update_participant"
  ON public.transactions FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- ------------------------------------------------------------
-- RLS POLICIES - transaction_items
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "tx_items_select_participant" ON public.transaction_items;
CREATE POLICY "tx_items_select_participant"
  ON public.transaction_items FOR SELECT TO authenticated
  USING (public.is_tx_participant(transaction_id));

DROP POLICY IF EXISTS "tx_items_insert_participant" ON public.transaction_items;
CREATE POLICY "tx_items_insert_participant"
  ON public.transaction_items FOR INSERT TO authenticated
  WITH CHECK (public.is_tx_participant(transaction_id));

DROP POLICY IF EXISTS "tx_items_update_participant" ON public.transaction_items;
CREATE POLICY "tx_items_update_participant"
  ON public.transaction_items FOR UPDATE TO authenticated
  USING (public.is_tx_participant(transaction_id))
  WITH CHECK (public.is_tx_participant(transaction_id));

DROP POLICY IF EXISTS "tx_items_delete_participant" ON public.transaction_items;
CREATE POLICY "tx_items_delete_participant"
  ON public.transaction_items FOR DELETE TO authenticated
  USING (public.is_tx_participant(transaction_id));

-- ------------------------------------------------------------
-- RLS POLICIES - messages
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
CREATE POLICY "messages_select_participant"
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_tx_participant(transaction_id));

DROP POLICY IF EXISTS "messages_insert_sender_participant" ON public.messages;
CREATE POLICY "messages_insert_sender_participant"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_tx_participant(transaction_id)
  );

DROP POLICY IF EXISTS "messages_update_sender_or_participant" ON public.messages;
CREATE POLICY "messages_update_sender_or_participant"
  ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR public.is_tx_participant(transaction_id))
  WITH CHECK (sender_id = auth.uid() OR public.is_tx_participant(transaction_id));

-- ------------------------------------------------------------
-- RLS POLICIES - message_attachments
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "attachments_select_participant" ON public.message_attachments;
CREATE POLICY "attachments_select_participant"
  ON public.message_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE m.id = message_id
        AND public.is_tx_participant(m.transaction_id)
    )
  );

DROP POLICY IF EXISTS "attachments_insert_participant" ON public.message_attachments;
CREATE POLICY "attachments_insert_participant"
  ON public.message_attachments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE m.id = message_id
        AND m.sender_id = auth.uid()
        AND public.is_tx_participant(m.transaction_id)
    )
  );

-- ------------------------------------------------------------
-- RLS POLICIES - moderation_logs
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "moderation_logs_service_role_only" ON public.moderation_logs;
CREATE POLICY "moderation_logs_service_role_only"
  ON public.moderation_logs FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- RLS POLICIES - rfqs
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "rfqs_select_owner_or_verified_seller" ON public.rfqs;
CREATE POLICY "rfqs_select_owner_or_verified_seller"
  ON public.rfqs FOR SELECT TO authenticated
  USING (
    buyer_id = auth.uid()
    OR (
      status = 'open'
      AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.kyc_status = 'verified'
          AND p.role IN ('seller', 'both')
      )
    )
  );

DROP POLICY IF EXISTS "rfqs_insert_owner_verified" ON public.rfqs;
CREATE POLICY "rfqs_insert_owner_verified"
  ON public.rfqs FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid() AND public.is_verified_user());

DROP POLICY IF EXISTS "rfqs_update_owner" ON public.rfqs;
CREATE POLICY "rfqs_update_owner"
  ON public.rfqs FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- ------------------------------------------------------------
-- RLS POLICIES - quotes
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "quotes_select_participant" ON public.quotes;
CREATE POLICY "quotes_select_participant"
  ON public.quotes FOR SELECT TO authenticated
  USING (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.rfqs r
      WHERE r.id = rfq_id
        AND r.buyer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "quotes_insert_verified_seller" ON public.quotes;
CREATE POLICY "quotes_insert_verified_seller"
  ON public.quotes FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND public.is_verified_user()
  );

DROP POLICY IF EXISTS "quotes_update_owner" ON public.quotes;
CREATE POLICY "quotes_update_owner"
  ON public.quotes FOR UPDATE TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- ------------------------------------------------------------
-- RLS POLICIES - transaction_events
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "tx_events_select_participant" ON public.transaction_events;
CREATE POLICY "tx_events_select_participant"
  ON public.transaction_events FOR SELECT TO authenticated
  USING (public.is_tx_participant(transaction_id));

DROP POLICY IF EXISTS "tx_events_insert_participant" ON public.transaction_events;
CREATE POLICY "tx_events_insert_participant"
  ON public.transaction_events FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND public.is_tx_participant(transaction_id)
  );

-- ------------------------------------------------------------
-- REALTIME
-- ------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction_events;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

