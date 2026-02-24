import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

  const { transactionId } = req.query;

  // Verify user is participant
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .select('buyer_id, seller_id')
    .eq('id', transactionId)
    .single();

  if (txError || !tx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  if (tx.buyer_id !== user.id && tx.seller_id !== user.id) {
    return res.status(403).json({ error: 'Not a participant of this transaction' });
  }

  // Fetch messages
  const { data: messages, error: fetchError } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id (
        id, company_name, country_code, role, avatar_url, badges
      ),
      attachments:message_attachments (*)
    `)
    .eq('transaction_id', transactionId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }

  return res.status(200).json(messages);
}
