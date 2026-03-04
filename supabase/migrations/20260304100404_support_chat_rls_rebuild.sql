-- ============================================================
-- SUNTREX — Support Chat RLS Rebuild
-- Date: 2026-03-04
-- Drop ALL existing policies on support tables, then recreate
-- clean user + agent policies.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. DROP ALL EXISTING POLICIES — SupportConversation
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users read own conversations"          ON public."SupportConversation";
DROP POLICY IF EXISTS "Users create own conversations"        ON public."SupportConversation";
DROP POLICY IF EXISTS "Users update own conversations"        ON public."SupportConversation";
DROP POLICY IF EXISTS "Users delete own conversations"        ON public."SupportConversation";
DROP POLICY IF EXISTS "Agents read conversations"             ON public."SupportConversation";
DROP POLICY IF EXISTS "Agents update conversations"           ON public."SupportConversation";
DROP POLICY IF EXISTS "support_conversations_select_own"      ON public."SupportConversation";
DROP POLICY IF EXISTS "support_conversations_insert_own"      ON public."SupportConversation";
DROP POLICY IF EXISTS "support_conversations_update_own"      ON public."SupportConversation";
DROP POLICY IF EXISTS "support_conversations_delete_own"      ON public."SupportConversation";

-- ────────────────────────────────────────────────────────────
-- 2. DROP ALL EXISTING POLICIES — SupportMessage
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users read own messages"                ON public."SupportMessage";
DROP POLICY IF EXISTS "Users create own messages"              ON public."SupportMessage";
DROP POLICY IF EXISTS "Users read own conversation messages"   ON public."SupportMessage";
DROP POLICY IF EXISTS "Users insert messages in own conversations" ON public."SupportMessage";
DROP POLICY IF EXISTS "Agents read messages"                   ON public."SupportMessage";
DROP POLICY IF EXISTS "Agents create messages"                 ON public."SupportMessage";
DROP POLICY IF EXISTS "support_messages_select_own"            ON public."SupportMessage";
DROP POLICY IF EXISTS "support_messages_insert_own"            ON public."SupportMessage";

-- ────────────────────────────────────────────────────────────
-- 3. DROP ALL EXISTING POLICIES — SupportAgent
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Agents read own profile"                ON public."SupportAgent";
DROP POLICY IF EXISTS "Agents update own profile"              ON public."SupportAgent";
DROP POLICY IF EXISTS "Authenticated read agents"              ON public."SupportAgent";

-- ────────────────────────────────────────────────────────────
-- 4. DROP ALL EXISTING POLICIES — SupportCannedResponse
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Agents read canned responses"           ON public."SupportCannedResponse";
DROP POLICY IF EXISTS "Authenticated read canned responses"    ON public."SupportCannedResponse";

-- ============================================================
-- HELPER: check if current user is a support agent
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_support_agent()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."SupportAgent"
    WHERE user_id = auth.uid()
  );
$$;

-- ============================================================
-- RECREATE RLS POLICIES
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SupportConversation
-- ────────────────────────────────────────────────────────────

-- Users read their own conversations
CREATE POLICY "Users read own conversations"
  ON public."SupportConversation" FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users create conversations (assigned to themselves)
CREATE POLICY "Users create own conversations"
  ON public."SupportConversation" FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users update their own conversations (e.g. satisfaction rating)
CREATE POLICY "Users update own conversations"
  ON public."SupportConversation" FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users delete their own conversations
CREATE POLICY "Users delete own conversations"
  ON public."SupportConversation" FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Agents can read ALL conversations (needed for assignment + support)
CREATE POLICY "Agents read conversations"
  ON public."SupportConversation" FOR SELECT TO authenticated
  USING (public.is_support_agent());

-- Agents can update ANY conversation (assign, change status, handoff)
CREATE POLICY "Agents update conversations"
  ON public."SupportConversation" FOR UPDATE TO authenticated
  USING (public.is_support_agent())
  WITH CHECK (public.is_support_agent());

-- ────────────────────────────────────────────────────────────
-- SupportMessage
-- ────────────────────────────────────────────────────────────

-- Users read messages from their own conversations
CREATE POLICY "Users read own messages"
  ON public."SupportMessage" FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."SupportConversation" c
      WHERE c.id = conversation_id
        AND c.user_id = auth.uid()
    )
  );

-- Users create messages in their own conversations (sender_type = user)
CREATE POLICY "Users create own messages"
  ON public."SupportMessage" FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'user'
    AND sender_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public."SupportConversation" c
      WHERE c.id = conversation_id
        AND c.user_id = auth.uid()
    )
  );

-- Agents can read ALL messages (needed for support workflow)
CREATE POLICY "Agents read messages"
  ON public."SupportMessage" FOR SELECT TO authenticated
  USING (public.is_support_agent());

-- Agents can create messages in any conversation (sender_type = agent)
CREATE POLICY "Agents create messages"
  ON public."SupportMessage" FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'agent'
    AND public.is_support_agent()
    AND EXISTS (
      SELECT 1
      FROM public."SupportAgent" a
      WHERE a.user_id = auth.uid()
        AND a.id = sender_id
    )
  );

-- ────────────────────────────────────────────────────────────
-- SupportAgent
-- ────────────────────────────────────────────────────────────

-- Agents read their own profile
CREATE POLICY "Agents read own profile"
  ON public."SupportAgent" FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Agents update their own profile (status, avatar, etc.)
CREATE POLICY "Agents update own profile"
  ON public."SupportAgent" FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- SupportCannedResponse
-- ────────────────────────────────────────────────────────────

-- Only agents can read canned responses
CREATE POLICY "Agents read canned responses"
  ON public."SupportCannedResponse" FOR SELECT TO authenticated
  USING (public.is_support_agent());
