import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Keyword moderation
const BLOCKED_PATTERNS = [
  /paypal\.me/i, /venmo/i, /zelle/i, /cashapp/i,
  /envoyez.*argent.*directement/i, /paiement.*hors.*plateforme/i,
  /wire.*transfer.*direct/i, /pay.*outside/i,
];
const WARNING_PATTERNS = [
  /\b\d{16,19}\b/, // card numbers
  /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/, // IBAN
  /@(gmail|yahoo|hotmail|outlook)\.\w+/i, // personal emails
  /\+?\d{10,15}/, // phone numbers
];

function moderateContent(body) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(body)) {
      return { status: 'flagged', score: 0.15, flags: ['fraud'] };
    }
  }
  let score = 0.95;
  const flags = [];
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(body)) {
      score -= 0.15;
      flags.push('personal_info');
    }
  }
  if (flags.length > 0) {
    return { status: 'flagged', score: Math.max(score, 0.1), flags };
  }
  return { status: 'approved', score, flags: [] };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { transaction_id, body, lang, reply_to } = req.body;
  if (!transaction_id || !body?.trim()) {
    return res.status(400).json({ error: 'transaction_id and body are required' });
  }

  // Verify user is participant
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .select('buyer_id, seller_id')
    .eq('id', transaction_id)
    .single();

  if (txError || !tx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  if (tx.buyer_id !== user.id && tx.seller_id !== user.id) {
    return res.status(403).json({ error: 'Not a participant of this transaction' });
  }

  // Determine sender role
  const senderRole = tx.seller_id === user.id ? 'seller' : 'buyer';

  // Moderate
  const moderation = moderateContent(body.trim());

  // Insert message
  const { data: message, error: insertError } = await supabase
    .from('messages')
    .insert({
      transaction_id,
      sender_id: user.id,
      sender_role: senderRole,
      body: body.trim(),
      original_lang: lang || 'fr',
      moderation_status: moderation.status,
      moderation_score: moderation.score,
      moderation_flags: moderation.flags,
      reply_to_id: reply_to || null,
    })
    .select(`
      *,
      sender:profiles!sender_id (
        id, company_name, country_code, role, avatar_url, badges
      )
    `)
    .single();

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  // Log if flagged
  if (moderation.status === 'flagged') {
    await supabase.from('moderation_logs').insert({
      message_id: message.id,
      transaction_id,
      action: 'auto_flagged',
      reason: moderation.flags.join(', '),
      score: moderation.score,
    }).catch(() => {}); // non-blocking
  }

  return res.status(201).json(message);
}
