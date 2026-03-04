-- Create consents table for RGPD compliance
CREATE TABLE IF NOT EXISTS public.consents (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cgv_accepted_at      timestamptz NOT NULL,
  marketing_suntrex    boolean DEFAULT false,
  marketing_partners   boolean DEFAULT false,
  ip_address           text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS (required by CLAUDE.md — no exceptions)
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own consent record
DROP POLICY IF EXISTS "Users manage own consents" ON public.consents;
CREATE POLICY "Users manage own consents"
  ON public.consents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS consents_user_id_idx ON public.consents(user_id);
