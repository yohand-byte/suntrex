-- ═══════════════════════════════════════════════════════════════
-- SUNTREX BLOG — Supabase Migration
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. BLOG ARTICLES TABLE
CREATE TABLE IF NOT EXISTS public.blog_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('market', 'tech', 'guides', 'brand', 'regulation', 'suntrex')),
  author_name TEXT NOT NULL DEFAULT 'SUNTREX',
  author_avatar TEXT DEFAULT 'S',
  tags TEXT[] DEFAULT '{}',
  hero_gradient TEXT DEFAULT 'linear-gradient(135deg, #1a3a5c 0%, #e8700a 100%)',
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  read_time INTEGER DEFAULT 5,
  -- SEO fields
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  -- AI generation metadata
  ai_generated BOOLEAN DEFAULT false,
  ai_model TEXT,
  ai_prompt TEXT,
  -- Counters (denormalized for performance)
  reactions_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.published = true AND OLD.published = false THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_articles_updated_at
  BEFORE UPDATE ON public.blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_updated_at();

-- Indexes
CREATE INDEX idx_blog_articles_slug ON public.blog_articles(slug);
CREATE INDEX idx_blog_articles_category ON public.blog_articles(category);
CREATE INDEX idx_blog_articles_published ON public.blog_articles(published);
CREATE INDEX idx_blog_articles_featured ON public.blog_articles(featured) WHERE featured = true;
CREATE INDEX idx_blog_articles_published_at ON public.blog_articles(published_at DESC) WHERE published = true;
CREATE INDEX idx_blog_articles_tags ON public.blog_articles USING GIN(tags);

-- Full-text search column (updated via trigger — to_tsvector is not immutable)
ALTER TABLE public.blog_articles ADD COLUMN IF NOT EXISTS fts tsvector;

CREATE OR REPLACE FUNCTION update_blog_fts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts :=
    setweight(to_tsvector('french', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW.content, '')), 'C') ||
    setweight(to_tsvector('french', coalesce(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_articles_fts_update
  BEFORE INSERT OR UPDATE ON public.blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_fts();

CREATE INDEX idx_blog_articles_fts ON public.blog_articles USING GIN(fts);

-- RLS Policies
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published articles
CREATE POLICY "Published articles are public"
  ON public.blog_articles FOR SELECT
  USING (published = true);

-- Authenticated admins can do everything
-- (In production, check for admin role)
CREATE POLICY "Admins can manage articles"
  ON public.blog_articles FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- 2. BLOG COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  content TEXT NOT NULL CHECK (char_length(content) >= 3 AND char_length(content) <= 2000),
  approved BOOLEAN DEFAULT false,
  -- Moderation
  flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_blog_comments_article ON public.blog_comments(article_id);
CREATE INDEX idx_blog_comments_approved ON public.blog_comments(article_id, approved) WHERE approved = true;
CREATE INDEX idx_blog_comments_user ON public.blog_comments(user_id);

-- Auto-update article comment count
CREATE OR REPLACE FUNCTION update_article_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.approved = true THEN
    UPDATE public.blog_articles SET comments_count = comments_count + 1 WHERE id = NEW.article_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.approved = true AND OLD.approved = false THEN
    UPDATE public.blog_articles SET comments_count = comments_count + 1 WHERE id = NEW.article_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.approved = false AND OLD.approved = true THEN
    UPDATE public.blog_articles SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' AND OLD.approved = true THEN
    UPDATE public.blog_articles SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.article_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_comments_count
  AFTER INSERT OR UPDATE OR DELETE ON public.blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_article_comments_count();

-- RLS Policies
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved comments
CREATE POLICY "Approved comments are public"
  ON public.blog_comments FOR SELECT
  USING (approved = true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can comment"
  ON public.blog_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can edit/delete their own comments
CREATE POLICY "Users can manage own comments"
  ON public.blog_comments FOR ALL
  USING (auth.uid() = user_id);

-- Admins can moderate all comments
CREATE POLICY "Admins can moderate comments"
  ON public.blog_comments FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- 3. BLOG REACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.blog_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Allow anonymous reactions with session tracking
  session_id TEXT,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('☀️', '🔥', '💡', '⚡', '📖', '🚀', '⚖️', '🌍')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- One reaction type per user per article
  UNIQUE(article_id, user_id, reaction_type),
  -- One reaction type per session per article (for anonymous)
  UNIQUE(article_id, session_id, reaction_type)
);

-- Indexes
CREATE INDEX idx_blog_reactions_article ON public.blog_reactions(article_id);

-- Auto-update article reaction count
CREATE OR REPLACE FUNCTION update_article_reactions_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.blog_articles
  SET reactions_count = (
    SELECT COUNT(*) FROM public.blog_reactions WHERE article_id = COALESCE(NEW.article_id, OLD.article_id)
  )
  WHERE id = COALESCE(NEW.article_id, OLD.article_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_reactions_count
  AFTER INSERT OR DELETE ON public.blog_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_article_reactions_count();

-- RLS Policies
ALTER TABLE public.blog_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read reactions (aggregated)
CREATE POLICY "Reactions are public"
  ON public.blog_reactions FOR SELECT
  USING (true);

-- Anyone can add reactions (rate-limited at app level)
CREATE POLICY "Anyone can react"
  ON public.blog_reactions FOR INSERT
  WITH CHECK (true);

-- Users can remove their own reactions
CREATE POLICY "Users can unreact"
  ON public.blog_reactions FOR DELETE
  USING (auth.uid() = user_id OR session_id IS NOT NULL);


-- 4. BLOG NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS public.blog_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscribed BOOLEAN DEFAULT true,
  source TEXT DEFAULT 'blog_sidebar',
  -- RGPD
  consent_marketing BOOLEAN DEFAULT false,
  consent_partners BOOLEAN DEFAULT false,
  ip_address INET,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX idx_blog_subscribers_email ON public.blog_subscribers(email);
CREATE INDEX idx_blog_subscribers_active ON public.blog_subscribers(subscribed) WHERE subscribed = true;

ALTER TABLE public.blog_subscribers ENABLE ROW LEVEL SECURITY;

-- Only server-side can manage subscribers
CREATE POLICY "Subscribers insert only"
  ON public.blog_subscribers FOR INSERT
  WITH CHECK (true);


-- 5. VIEW: Article reactions aggregated
CREATE OR REPLACE VIEW public.blog_article_reactions AS
SELECT
  article_id,
  reaction_type,
  COUNT(*) as count
FROM public.blog_reactions
GROUP BY article_id, reaction_type;


-- 6. FUNCTION: Get article by slug with reactions
CREATE OR REPLACE FUNCTION public.get_blog_article(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'article', row_to_json(a.*),
    'reactions', (
      SELECT json_object_agg(reaction_type, count)
      FROM public.blog_article_reactions
      WHERE article_id = a.id
    ),
    'comments', (
      SELECT json_agg(row_to_json(c.*) ORDER BY c.created_at DESC)
      FROM public.blog_comments c
      WHERE c.article_id = a.id AND c.approved = true
    )
  ) INTO result
  FROM public.blog_articles a
  WHERE a.slug = p_slug AND a.published = true;

  -- Increment view count
  UPDATE public.blog_articles SET views_count = views_count + 1 WHERE slug = p_slug;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. FUNCTION: Full-text search articles
CREATE OR REPLACE FUNCTION public.search_blog_articles(search_query TEXT, limit_count INTEGER DEFAULT 10)
RETURNS SETOF public.blog_articles AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.blog_articles
  WHERE published = true
    AND fts @@ plainto_tsquery('french', search_query)
  ORDER BY ts_rank(fts, plainto_tsquery('french', search_query)) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;


-- 8. SEED DATA (optional — remove in production)
INSERT INTO public.blog_articles (slug, title, excerpt, content, category, author_name, author_avatar, tags, hero_gradient, featured, published, read_time, seo_title, seo_description, published_at)
VALUES
  ('european-solar-market-2026', 'Marché solaire européen 2026 : les 5 tendances qui redessinent le secteur', 'L''UE atteint 406 GW mais la contraction du résidentiel transforme le paysage.', 'Le marché solaire européen entre dans une phase de maturation...', 'market', 'SUNTREX Research', 'S', ARRAY['Europe', 'Tendances', 'CFD', 'Stockage'], 'linear-gradient(135deg, #1a3a5c 0%, #2d6aa0 50%, #e8910a 100%)', true, true, 8, 'Marché solaire européen 2026 | SUNTREX Blog', 'Analyse des 5 tendances majeures du marché solaire européen en 2026.', NOW()),
  ('huawei-vs-deye-2026', 'Huawei SUN2000 vs Deye Hybrid : comparatif onduleurs 2026', 'Deux philosophies, deux gammes de prix. Analyse pour installateurs.', 'Pour un installateur, le choix de l''onduleur est stratégique...', 'brand', 'SUNTREX Tech', 'T', ARRAY['Huawei', 'Deye', 'Onduleurs', 'Comparatif'], 'linear-gradient(135deg, #e4002b 0%, #c00020 50%, #0068b7 100%)', true, true, 12, 'Huawei vs Deye 2026 | SUNTREX', 'Comparatif Huawei SUN2000 vs Deye pour installateurs.', NOW()),
  ('suntrex-marketplace-launch', 'SUNTREX lance la marketplace PV avec livraison vérifiée et IA', 'Commissions -5%, SUNTREX DELIVERY, support multi-canal, IA intégrée.', 'SUNTREX entre sur le marché avec une ambition claire...', 'suntrex', 'Équipe SUNTREX', '☀', ARRAY['SUNTREX', 'Marketplace', 'IA', 'Delivery'], 'linear-gradient(135deg, #E8700A 0%, #C5870F 50%, #2D8F3E 100%)', false, true, 5, 'SUNTREX : marketplace PV Europe | Lancement', 'SUNTREX lance la marketplace PV B2B européenne.', NOW())
ON CONFLICT (slug) DO NOTHING;

-- Done!
-- Next: Create Netlify Function for RSS feed at /api/blog-rss
-- Next: Create Netlify Function for AI article generation
-- Next: Add sitemap.xml generation for SEO
