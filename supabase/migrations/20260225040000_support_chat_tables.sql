-- ═══════════════════════════════════════════════════════════════
-- SUNTREX Support Chat — Database Migration
-- Tables: SupportConversation, SupportMessage, SupportAgent, SupportCannedResponse
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. SupportAgent ───
CREATE TABLE IF NOT EXISTS public."SupportAgent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online','offline','busy')),
  languages TEXT[] DEFAULT ARRAY['FR'],
  specialties TEXT[] DEFAULT '{}',
  max_concurrent INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. SupportConversation ───
CREATE TABLE IF NOT EXISTS public."SupportConversation" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','waiting_agent','active','resolved','closed')),
  channel TEXT NOT NULL DEFAULT 'chat' CHECK (channel IN ('chat','whatsapp','email','phone')),
  assigned_agent_id UUID REFERENCES public."SupportAgent"(id) ON DELETE SET NULL,
  ai_mode BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  handoff_reason TEXT,
  handoff_at TIMESTAMPTZ,
  satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. SupportMessage ───
CREATE TABLE IF NOT EXISTS public."SupportMessage" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public."SupportConversation"(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user','ai','agent','system')),
  sender_id UUID REFERENCES public."SupportAgent"(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  attachments JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. SupportCannedResponse ───
CREATE TABLE IF NOT EXISTS public."SupportCannedResponse" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  shortcut TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT DEFAULT 'FR',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_support_conv_user ON public."SupportConversation"(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conv_status ON public."SupportConversation"(status);
CREATE INDEX IF NOT EXISTS idx_support_conv_agent ON public."SupportConversation"(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_support_msg_conv ON public."SupportMessage"(conversation_id);
CREATE INDEX IF NOT EXISTS idx_support_msg_created ON public."SupportMessage"(created_at);
CREATE INDEX IF NOT EXISTS idx_support_agent_status ON public."SupportAgent"(status);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public."SupportConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SupportMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SupportAgent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SupportCannedResponse" ENABLE ROW LEVEL SECURITY;

-- SupportConversation: users see own, agents see all
CREATE POLICY "Users read own conversations"
  ON public."SupportConversation" FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own conversations"
  ON public."SupportConversation" FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users update own conversations"
  ON public."SupportConversation" FOR UPDATE
  USING (auth.uid() = user_id);

-- SupportMessage: users see messages from own conversations
CREATE POLICY "Users read own conversation messages"
  ON public."SupportMessage" FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public."SupportConversation"
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert messages in own conversations"
  ON public."SupportMessage" FOR INSERT
  WITH CHECK (
    sender_type = 'user'
    AND conversation_id IN (
      SELECT id FROM public."SupportConversation"
      WHERE user_id = auth.uid()
    )
  );

-- SupportAgent: all authenticated users can read (to show agent info in chat)
CREATE POLICY "Authenticated read agents"
  ON public."SupportAgent" FOR SELECT
  USING (auth.role() = 'authenticated');

-- SupportCannedResponse: all authenticated users can read
CREATE POLICY "Authenticated read canned responses"
  ON public."SupportCannedResponse" FOR SELECT
  USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════
-- REALTIME PUBLICATION
-- ═══════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE public."SupportMessage";
ALTER PUBLICATION supabase_realtime ADD TABLE public."SupportConversation";

-- ═══════════════════════════════════════════════════════════════
-- AUTO-UPDATE updated_at TRIGGER
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_support_conv_updated
  BEFORE UPDATE ON public."SupportConversation"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_support_agent_updated
  BEFORE UPDATE ON public."SupportAgent"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKET
-- ═══════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  FALSE,
  10485760, -- 10MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users upload to own conversation folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users read own conversation attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments'
    AND auth.role() = 'authenticated'
  );

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════

-- Support agents
INSERT INTO public."SupportAgent" (display_name, avatar_url, status, languages, specialties) VALUES
  ('Marie L.', NULL, 'online', ARRAY['FR','EN'], ARRAY['orders','shipping','returns']),
  ('Thomas K.', NULL, 'online', ARRAY['FR','DE','EN'], ARRAY['technical','inverters','batteries']),
  ('Sofia R.', NULL, 'offline', ARRAY['FR','ES','IT'], ARRAY['payments','billing','accounts'])
ON CONFLICT DO NOTHING;

-- Canned responses
INSERT INTO public."SupportCannedResponse" (category, shortcut, title, content, language) VALUES
  ('greeting', '/hello', 'Welcome', 'Bonjour ! Bienvenue sur SUNTREX. Comment puis-je vous aider ?', 'FR'),
  ('greeting', '/helloen', 'Welcome EN', 'Hello! Welcome to SUNTREX. How can I help you?', 'EN'),
  ('orders', '/track', 'Track order', 'Pour suivre votre commande, rendez-vous dans votre espace client > Mes commandes. Vous y trouverez le numéro de suivi.', 'FR'),
  ('orders', '/delay', 'Shipping delay', 'Les délais de livraison standard sont de 3-5 jours ouvrés en France, 5-8 jours en Europe. Un retard peut survenir en période de forte demande.', 'FR'),
  ('technical', '/compat', 'Compatibility check', 'Pour vérifier la compatibilité entre un onduleur et des panneaux, vérifiez : la tension Voc max, le courant Isc, et la puissance totale de la chaîne.', 'FR'),
  ('payments', '/invoice', 'Invoice request', 'Votre facture est disponible dans Mes commandes > Détail de la commande > Télécharger la facture. Si vous ne la trouvez pas, donnez-moi votre numéro de commande.', 'FR'),
  ('returns', '/return', 'Return policy', 'Vous disposez de 14 jours pour retourner un produit non utilisé dans son emballage d''origine. Les frais de retour sont à la charge de l''acheteur sauf défaut du produit.', 'FR'),
  ('closing', '/bye', 'Closing', 'Merci pour votre visite ! N''hésitez pas à revenir si vous avez d''autres questions. Bonne journée ! ☀️', 'FR')
ON CONFLICT (shortcut) DO NOTHING;
