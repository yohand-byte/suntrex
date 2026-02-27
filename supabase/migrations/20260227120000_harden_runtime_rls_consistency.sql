-- ============================================================
-- SUNTREX runtime hardening: schema constraints + RLS alignment
-- Date: 2026-02-27
-- Goal:
--   - tighten tenant isolation for transaction/chat/stripe runtime tables
--   - add explicit constraints for critical transactional fields
--   - keep migration idempotent and safe on partially-migrated projects
-- ============================================================

-- ------------------------------------------------------------
-- TABLE-LEVEL RLS HARDENING (runtime tables)
-- ------------------------------------------------------------
ALTER TABLE IF EXISTS public.transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transaction_items FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_attachments FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.moderation_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transaction_events FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public."SupportConversation" FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."SupportMessage" FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- CRITICAL CONSTRAINTS (runtime lowercase tables)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.transactions') IS NOT NULL THEN
    UPDATE public.transactions
    SET currency = upper(currency)
    WHERE currency IS NOT NULL
      AND currency <> upper(currency);

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'transactions_buyer_seller_distinct_chk'
        AND conrelid = 'public.transactions'::regclass
    ) THEN
      ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_buyer_seller_distinct_chk
        CHECK (buyer_id IS DISTINCT FROM seller_id) NOT VALID;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'transactions_amounts_non_negative_chk'
        AND conrelid = 'public.transactions'::regclass
    ) THEN
      ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_amounts_non_negative_chk
        CHECK (
          subtotal_amount >= 0
          AND vat_amount >= 0
          AND delivery_amount >= 0
          AND total_amount >= 0
        ) NOT VALID;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'transactions_total_consistent_chk'
        AND conrelid = 'public.transactions'::regclass
    ) THEN
      ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_total_consistent_chk
        CHECK (total_amount = subtotal_amount + vat_amount + delivery_amount) NOT VALID;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'transactions_currency_iso3_chk'
        AND conrelid = 'public.transactions'::regclass
    ) THEN
      ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_currency_iso3_chk
        CHECK (currency ~ '^[A-Z]{3}$') NOT VALID;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'messages_moderation_score_bounds_chk'
        AND conrelid = 'public.messages'::regclass
    ) THEN
      ALTER TABLE public.messages
        ADD CONSTRAINT messages_moderation_score_bounds_chk
        CHECK (
          moderation_score IS NULL
          OR (moderation_score >= 0 AND moderation_score <= 1)
        ) NOT VALID;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.transaction_events') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'transaction_events_event_type_not_blank_chk'
        AND conrelid = 'public.transaction_events'::regclass
    ) THEN
      ALTER TABLE public.transaction_events
        ADD CONSTRAINT transaction_events_event_type_not_blank_chk
        CHECK (length(trim(event_type)) > 0) NOT VALID;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."SupportMessage"') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'support_message_content_not_blank_chk'
        AND conrelid = 'public."SupportMessage"'::regclass
    ) THEN
      ALTER TABLE public."SupportMessage"
        ADD CONSTRAINT support_message_content_not_blank_chk
        CHECK (length(trim(content)) > 0) NOT VALID;
    END IF;
  END IF;
END $$;

-- ------------------------------------------------------------
-- IMMUTABILITY / CONSISTENCY GUARDS
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_transactions_actor_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.buyer_id IS DISTINCT FROM OLD.buyer_id THEN
    RAISE EXCEPTION 'buyer_id is immutable';
  END IF;

  IF NEW.seller_id IS DISTINCT FROM OLD.seller_id THEN
    RAISE EXCEPTION 'seller_id is immutable';
  END IF;

  IF NEW.buyer_id = NEW.seller_id THEN
    RAISE EXCEPTION 'buyer_id and seller_id must be distinct';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.transactions') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_transactions_actor_integrity ON public.transactions;
    CREATE TRIGGER trg_transactions_actor_integrity
      BEFORE UPDATE ON public.transactions
      FOR EACH ROW
      EXECUTE FUNCTION public.enforce_transactions_actor_integrity();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_messages_sender_role_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  tx_buyer UUID;
  tx_seller UUID;
BEGIN
  IF NEW.sender_role = 'system' THEN
    RETURN NEW;
  END IF;

  SELECT t.buyer_id, t.seller_id
  INTO tx_buyer, tx_seller
  FROM public.transactions t
  WHERE t.id = NEW.transaction_id;

  IF tx_buyer IS NULL AND tx_seller IS NULL THEN
    RAISE EXCEPTION 'Unknown transaction_id for message';
  END IF;

  IF NEW.sender_id = tx_buyer THEN
    IF NEW.sender_role <> 'buyer' THEN
      RAISE EXCEPTION 'sender_role must be buyer for buyer sender_id';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.sender_id = tx_seller THEN
    IF NEW.sender_role <> 'seller' THEN
      RAISE EXCEPTION 'sender_role must be seller for seller sender_id';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'sender_id must be a transaction participant';
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_messages_sender_role_consistency ON public.messages;
    CREATE TRIGGER trg_messages_sender_role_consistency
      BEFORE INSERT OR UPDATE OF transaction_id, sender_id, sender_role
      ON public.messages
      FOR EACH ROW
      EXECUTE FUNCTION public.enforce_messages_sender_role_consistency();
  END IF;
END $$;

-- ------------------------------------------------------------
-- RLS POLICY HARDENING (lowercase runtime)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "messages_update_sender_or_participant" ON public.messages;
DROP POLICY IF EXISTS "messages_update_sender_only" ON public.messages;
CREATE POLICY "messages_update_sender_only"
  ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid() AND public.is_tx_participant(transaction_id));

DROP POLICY IF EXISTS "transactions_update_participant" ON public.transactions;
CREATE POLICY "transactions_update_participant"
  ON public.transactions FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (
    (buyer_id = auth.uid() OR seller_id = auth.uid())
    AND buyer_id IS DISTINCT FROM seller_id
  );

-- ------------------------------------------------------------
-- RLS POLICY HARDENING (support chat quoted tables)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users read own conversations" ON public."SupportConversation";
DROP POLICY IF EXISTS "Users create own conversations" ON public."SupportConversation";
DROP POLICY IF EXISTS "Users update own conversations" ON public."SupportConversation";
DROP POLICY IF EXISTS "Users delete own conversations" ON public."SupportConversation";
DROP POLICY IF EXISTS "support_conversations_select_own" ON public."SupportConversation";
DROP POLICY IF EXISTS "support_conversations_insert_own" ON public."SupportConversation";
DROP POLICY IF EXISTS "support_conversations_update_own" ON public."SupportConversation";
DROP POLICY IF EXISTS "support_conversations_delete_own" ON public."SupportConversation";

CREATE POLICY "support_conversations_select_own"
  ON public."SupportConversation" FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "support_conversations_insert_own"
  ON public."SupportConversation" FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "support_conversations_update_own"
  ON public."SupportConversation" FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "support_conversations_delete_own"
  ON public."SupportConversation" FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own conversation messages" ON public."SupportMessage";
DROP POLICY IF EXISTS "Users insert messages in own conversations" ON public."SupportMessage";
DROP POLICY IF EXISTS "support_messages_select_own" ON public."SupportMessage";
DROP POLICY IF EXISTS "support_messages_insert_own" ON public."SupportMessage";

CREATE POLICY "support_messages_select_own"
  ON public."SupportMessage" FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."SupportConversation" c
      WHERE c.id = conversation_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "support_messages_insert_own"
  ON public."SupportMessage" FOR INSERT TO authenticated
  WITH CHECK (
    sender_id IS NULL
    AND sender_type IN ('user', 'system')
    AND EXISTS (
      SELECT 1
      FROM public."SupportConversation" c
      WHERE c.id = conversation_id
        AND c.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- STORAGE POLICY HARDENING (support attachments isolation)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users upload to own conversation folder" ON storage.objects;
DROP POLICY IF EXISTS "Users read own conversation attachments" ON storage.objects;
DROP POLICY IF EXISTS "support_attachments_insert_owner" ON storage.objects;
DROP POLICY IF EXISTS "support_attachments_select_owner" ON storage.objects;
DROP POLICY IF EXISTS "support_attachments_delete_owner" ON storage.objects;

CREATE POLICY "support_attachments_insert_owner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND split_part(name, '/', 1) = 'support'
    AND nullif(split_part(name, '/', 2), '') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public."SupportConversation" c
      WHERE c.id::text = split_part(name, '/', 2)
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "support_attachments_select_owner"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND split_part(name, '/', 1) = 'support'
    AND nullif(split_part(name, '/', 2), '') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public."SupportConversation" c
      WHERE c.id::text = split_part(name, '/', 2)
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "support_attachments_delete_owner"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND split_part(name, '/', 1) = 'support'
    AND nullif(split_part(name, '/', 2), '') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public."SupportConversation" c
      WHERE c.id::text = split_part(name, '/', 2)
        AND c.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- RLS COMPATIBILITY FOR LEGACY QUOTED TABLES USED BY STRIPE FLOWS
-- (only applied when snake_case runtime columns exist)
-- ------------------------------------------------------------
DO $$
DECLARE
  has_order_snake BOOLEAN;
  has_order_item_snake BOOLEAN;
  has_notification_snake BOOLEAN;
BEGIN
  IF to_regclass('public."Order"') IS NOT NULL THEN
    SELECT
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Order'
          AND column_name = 'buyer_id'
      )
      AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Order'
          AND column_name = 'seller_id'
      )
    INTO has_order_snake;

    IF has_order_snake THEN
      EXECUTE 'DROP POLICY IF EXISTS "orders_select_participant" ON public."Order"';
      EXECUTE 'DROP POLICY IF EXISTS "orders_update_seller" ON public."Order"';
      EXECUTE 'DROP POLICY IF EXISTS "orders_select_participant_snake" ON public."Order"';
      EXECUTE 'DROP POLICY IF EXISTS "orders_update_participant_snake" ON public."Order"';
      EXECUTE 'CREATE POLICY "orders_select_participant_snake" ON public."Order" FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid())';
      EXECUTE 'CREATE POLICY "orders_update_participant_snake" ON public."Order" FOR UPDATE TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid()) WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid())';
    END IF;
  END IF;

  IF to_regclass('public."OrderItem"') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'OrderItem'
        AND column_name = 'order_id'
    ) INTO has_order_item_snake;

    IF has_order_item_snake THEN
      EXECUTE 'DROP POLICY IF EXISTS "orderitems_select_participant" ON public."OrderItem"';
      EXECUTE 'DROP POLICY IF EXISTS "orderitems_select_participant_snake" ON public."OrderItem"';
      EXECUTE '
        CREATE POLICY "orderitems_select_participant_snake"
        ON public."OrderItem" FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public."Order" o
            WHERE o.id = order_id
              AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
          )
        )
      ';
    END IF;
  END IF;

  IF to_regclass('public."Notification"') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Notification'
        AND column_name = 'user_id'
    ) INTO has_notification_snake;

    IF has_notification_snake THEN
      EXECUTE 'DROP POLICY IF EXISTS "notifications_select_own" ON public."Notification"';
      EXECUTE 'DROP POLICY IF EXISTS "notifications_update_own" ON public."Notification"';
      EXECUTE 'DROP POLICY IF EXISTS "notifications_delete_own" ON public."Notification"';
      EXECUTE 'DROP POLICY IF EXISTS "notifications_select_own_snake" ON public."Notification"';
      EXECUTE 'DROP POLICY IF EXISTS "notifications_update_own_snake" ON public."Notification"';
      EXECUTE 'DROP POLICY IF EXISTS "notifications_delete_own_snake" ON public."Notification"';
      EXECUTE 'CREATE POLICY "notifications_select_own_snake" ON public."Notification" FOR SELECT TO authenticated USING (user_id = auth.uid())';
      EXECUTE 'CREATE POLICY "notifications_update_own_snake" ON public."Notification" FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
      EXECUTE 'CREATE POLICY "notifications_delete_own_snake" ON public."Notification" FOR DELETE TO authenticated USING (user_id = auth.uid())';
    END IF;
  END IF;
END $$;
