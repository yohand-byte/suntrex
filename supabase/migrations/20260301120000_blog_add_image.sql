-- Add image column to blog_articles
ALTER TABLE public.blog_articles ADD COLUMN IF NOT EXISTS image TEXT;

-- Update seed articles with Unsplash photos
UPDATE public.blog_articles SET image = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80' WHERE slug = 'european-solar-market-2026';
UPDATE public.blog_articles SET image = 'https://images.unsplash.com/photo-1592833159117-ac62bc51e9be?w=900&q=80' WHERE slug = 'huawei-vs-deye-2026';
UPDATE public.blog_articles SET image = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80' WHERE slug = 'suntrex-marketplace-launch';
