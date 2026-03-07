const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FALLBACK_IMAGES = {
  market:     'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80',
  tech:       'https://images.unsplash.com/photo-1592833159117-ac62bc51e9be?w=900&q=80',
  guides:     'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=900&q=80',
  brand:      'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=900&q=80',
  regulation: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&q=80',
  suntrex:    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80',
  default:    'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80',
};

const SLUG_IMAGE_MAP = {
  'european-solar-market-2026':                         'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80',
  'huawei-vs-deye-2026':                                'https://images.unsplash.com/photo-1592833159117-ac62bc51e9be?w=900&q=80',
  'guide-batteries-stockage-2026':                      'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=900&q=80',
  'n-type-topcon-revolution':                           'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=900&q=80',
  'reglementation-pv-france-2026':                      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&q=80',
  'suntrex-marketplace-launch':                         'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80',
  'intersolar-europe-2026':                             'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80',
  'top-10-panneaux-2026':                               'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=900&q=80',
  'prix-panneaux-solaires-b2b-grossiste-2026':          'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=900&q=80',
  'comparatif-batteries-stockage-solaire-b2b-2026':     'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=900&q=80',
  'marketplace-equipement-photovoltaique-b2b-europe-guide': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80',
  'reglementation-photovoltaique-france-tva-aides-2026':'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&q=80',
  'top-onduleurs-solaires-professionnels-2026':         'https://images.unsplash.com/photo-1592833159117-ac62bc51e9be?w=900&q=80',
};

async function checkAndFixImages() {
  const { data: articles, error } = await supabase
    .from('blog_articles')
    .select('id, slug, title, category, image')
    .order('created_at', { ascending: false });

  if (error) { console.error('Supabase error:', error.message); process.exit(1); }

  console.log(`\nTotal articles : ${articles.length}\n`);

  const missing = articles.filter(a => !a.image || a.image.trim() === '');
  const present = articles.filter(a => a.image && a.image.trim() !== '');

  console.log(`✅ Avec image    : ${present.length}`);
  console.log(`❌ Sans image    : ${missing.length}`);

  if (missing.length === 0) {
    console.log('\n🎉 Tous les articles ont une image. Rien à faire.');
    process.exit(0);
  }

  console.log('\nArticles sans image :');
  missing.forEach(a => console.log(`  - [${a.category}] ${a.slug}`));

  console.log('\n🔧 Correction en cours...');
  let fixed = 0;

  for (const article of missing) {
    const image =
      SLUG_IMAGE_MAP[article.slug] ||
      FALLBACK_IMAGES[article.category] ||
      FALLBACK_IMAGES.default;

    const { error: updateError } = await supabase
      .from('blog_articles')
      .update({ image, updated_at: new Date().toISOString() })
      .eq('id', article.id);

    if (updateError) {
      console.error(`  ❌ Echec ${article.slug}: ${updateError.message}`);
    } else {
      console.log(`  ✅ Fixed: ${article.slug} → ${image}`);
      fixed++;
    }
  }

  console.log(`\n✅ ${fixed}/${missing.length} articles corrigés.`);

  const { data: check } = await supabase
    .from('blog_articles')
    .select('slug, image')
    .is('image', null);

  if (!check || check.length === 0) {
    console.log('✅ Vérification finale : 0 articles sans image.');
  } else {
    console.error(`⚠️  ${check.length} articles encore sans image :`, check.map(a => a.slug));
    process.exit(1);
  }
}

checkAndFixImages().catch(console.error);
