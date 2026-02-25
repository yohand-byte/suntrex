-- ============================================================
-- SUNTREX SECURITY FIX — Enable RLS + Policies on all tables
-- Schema: camelCase columns, all IDs are TEXT type
-- auth.uid() returns UUID → must cast to TEXT for comparisons
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. ENABLE RLS ON ALL PUBLIC TABLES
-- ──────────────────────────────────────────────

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Listing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Warehouse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RFQ" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Quote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- Helper: get current user's companyId
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "companyId" FROM public."User" WHERE id = auth.uid()::text LIMIT 1;
$$;

-- ══════════════════════════════════════════════
-- USER TABLE
-- ══════════════════════════════════════════════

CREATE POLICY "users_select_own"
  ON public."User" FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "users_update_own"
  ON public."User" FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "users_insert_self"
  ON public."User" FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- ══════════════════════════════════════════════
-- COMPANY TABLE
-- ══════════════════════════════════════════════

CREATE POLICY "companies_select_authenticated"
  ON public."Company" FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "companies_update_owner"
  ON public."Company" FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE public."User".id = auth.uid()::text
      AND public."User"."companyId" = public."Company".id
      AND public."User".role = 'ADMIN'
    )
  );

CREATE POLICY "companies_insert_authenticated"
  ON public."Company" FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ══════════════════════════════════════════════
-- LISTING TABLE
-- ══════════════════════════════════════════════

CREATE POLICY "listings_select_authenticated"
  ON public."Listing" FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "listings_insert_seller"
  ON public."Listing" FOR INSERT
  TO authenticated
  WITH CHECK ("sellerId" = public.get_my_company_id());

CREATE POLICY "listings_update_seller"
  ON public."Listing" FOR UPDATE
  TO authenticated
  USING ("sellerId" = public.get_my_company_id());

CREATE POLICY "listings_delete_seller"
  ON public."Listing" FOR DELETE
  TO authenticated
  USING ("sellerId" = public.get_my_company_id());

-- ══════════════════════════════════════════════
-- WAREHOUSE TABLE
-- ══════════════════════════════════════════════

CREATE POLICY "warehouses_select_owner"
  ON public."Warehouse" FOR SELECT
  TO authenticated
  USING ("companyId" = public.get_my_company_id());

CREATE POLICY "warehouses_insert_owner"
  ON public."Warehouse" FOR INSERT
  TO authenticated
  WITH CHECK ("companyId" = public.get_my_company_id());

CREATE POLICY "warehouses_update_owner"
  ON public."Warehouse" FOR UPDATE
  TO authenticated
  USING ("companyId" = public.get_my_company_id());

CREATE POLICY "warehouses_delete_owner"
  ON public."Warehouse" FOR DELETE
  TO authenticated
  USING ("companyId" = public.get_my_company_id());

-- ══════════════════════════════════════════════
-- ORDER TABLE
-- ══════════════════════════════════════════════

CREATE POLICY "orders_select_participant"
  ON public."Order" FOR SELECT
  TO authenticated
  USING (
    "buyerId" = public.get_my_company_id()
    OR "sellerId" = public.get_my_company_id()
  );

CREATE POLICY "orders_update_seller"
  ON public."Order" FOR UPDATE
  TO authenticated
  USING ("sellerId" = public.get_my_company_id())
  WITH CHECK ("sellerId" = public.get_my_company_id());

-- ══════════════════════════════════════════════
-- ORDERITEM TABLE
-- ══════════════════════════════════════════════

CREATE POLICY "orderitems_select_participant"
  ON public."OrderItem" FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Order"
      WHERE public."Order".id = public."OrderItem"."orderId"
      AND (
        public."Order"."buyerId" = public.get_my_company_id()
        OR public."Order"."sellerId" = public.get_my_company_id()
      )
    )
  );

-- ══════════════════════════════════════════════
-- RFQ TABLE
-- ══════════════════════════════════════════════

CREATE POLICY "rfq_select_buyer"
  ON public."RFQ" FOR SELECT
  TO authenticated
  USING ("buyerId" = public.get_my_company_id());

CREATE POLICY "rfq_select_sellers"
  ON public."RFQ" FOR SELECT
  TO authenticated
  USING (
    "status" = 'OPEN'::"RFQStatus"
    AND EXISTS (
      SELECT 1 FROM public."User"
      JOIN public."Company" ON public."Company".id = public."User"."companyId"
      WHERE public."User".id = auth.uid()::text
      AND public."Company".role = 'SELLER'::"CompanyRole"
    )
  );

CREATE POLICY "rfq_insert_buyer"
  ON public."RFQ" FOR INSERT
  TO authenticated
  WITH CHECK ("buyerId" = public.get_my_company_id());

CREATE POLICY "rfq_update_buyer"
  ON public."RFQ" FOR UPDATE
  TO authenticated
  USING ("buyerId" = public.get_my_company_id())
  WITH CHECK ("buyerId" = public.get_my_company_id());

-- ══════════════════════════════════════════════
-- QUOTE TABLE
-- ══════════════════════════════════════════════

CREATE POLICY "quotes_select_seller"
  ON public."Quote" FOR SELECT
  TO authenticated
  USING ("sellerId" = public.get_my_company_id());

CREATE POLICY "quotes_select_buyer"
  ON public."Quote" FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."RFQ"
      WHERE public."RFQ".id = public."Quote"."rfqId"
      AND public."RFQ"."buyerId" = public.get_my_company_id()
    )
  );

CREATE POLICY "quotes_insert_seller"
  ON public."Quote" FOR INSERT
  TO authenticated
  WITH CHECK ("sellerId" = public.get_my_company_id());

CREATE POLICY "quotes_update_seller"
  ON public."Quote" FOR UPDATE
  TO authenticated
  USING ("sellerId" = public.get_my_company_id())
  WITH CHECK ("sellerId" = public.get_my_company_id());

-- ══════════════════════════════════════════════
-- REVIEW TABLE
-- ══════════════════════════════════════════════

CREATE POLICY "reviews_select_all"
  ON public."Review" FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "reviews_insert_own"
  ON public."Review" FOR INSERT
  TO authenticated
  WITH CHECK ("authorId" = public.get_my_company_id());

CREATE POLICY "reviews_update_own"
  ON public."Review" FOR UPDATE
  TO authenticated
  USING ("authorId" = public.get_my_company_id())
  WITH CHECK ("authorId" = public.get_my_company_id());

-- ══════════════════════════════════════════════
-- NOTIFICATION TABLE
-- Notification.userId = User.id (matches auth.uid())
-- ══════════════════════════════════════════════

CREATE POLICY "notifications_select_own"
  ON public."Notification" FOR SELECT
  TO authenticated
  USING ("userId" = auth.uid()::text);

CREATE POLICY "notifications_update_own"
  ON public."Notification" FOR UPDATE
  TO authenticated
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "notifications_delete_own"
  ON public."Notification" FOR DELETE
  TO authenticated
  USING ("userId" = auth.uid()::text);

-- ──────────────────────────────────────────────
-- 3. FIX WARNINGS
-- ──────────────────────────────────────────────

-- Warning 1: Fix mutable search_path on match_rag_documents
ALTER FUNCTION public.match_rag_documents SET search_path = public, extensions;

-- Warning 2: Move vector extension to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION vector SCHEMA extensions;

-- Recreate rag_documents embedding column with proper schema reference
ALTER TABLE public.rag_documents
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);
