import { supabase } from '../../lib/supabase';

// ─── Create or resume a support conversation ───
export async function getOrCreateConversation(userId, metadata = {}) {
  if (!supabase) return { id: 'demo-conv-' + Date.now(), isDemo: true };

  // Check for existing open conversation
  if (userId) {
    const { data: existing } = await supabase
      .from('SupportConversation')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1);

    if (existing?.length > 0) return existing[0];
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('SupportConversation')
    .insert({
      user_id: userId || null,
      status: 'open',
      channel: 'chat',
      metadata: metadata,
      assigned_agent_id: null,
      ai_mode: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return { id: 'demo-conv-' + Date.now(), isDemo: true };
  }
  return data;
}

// ─── Send a message ───
export async function sendMessage(conversationId, { text, from, attachments = [], agentId = null }) {
  if (!supabase || conversationId.startsWith('demo-')) return null;

  const { data, error } = await supabase
    .from('SupportMessage')
    .insert({
      conversation_id: conversationId,
      sender_type: from, // 'user' | 'ai' | 'agent' | 'system'
      sender_id: from === 'agent' ? agentId : null,
      content: text,
      attachments: attachments.length > 0 ? attachments : null,
    })
    .select()
    .single();

  if (error) console.error('Error sending message:', error);
  return data;
}

// ─── Load message history ───
export async function loadMessages(conversationId, limit = 50) {
  if (!supabase || conversationId.startsWith('demo-')) return [];

  const { data, error } = await supabase
    .from('SupportMessage')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error loading messages:', error);
    return [];
  }
  return data;
}

// ─── Subscribe to realtime messages ───
export function subscribeToMessages(conversationId, callback) {
  if (!supabase || conversationId.startsWith('demo-')) return { unsubscribe: () => {} };

  const channel = supabase
    .channel(`support-msg-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'SupportMessage',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel),
  };
}

// ─── Upload attachment to Supabase Storage ───
export async function uploadAttachment(conversationId, file) {
  if (!supabase) return { path: null, url: null, name: file.name, size: file.size };

  const filePath = `support/${conversationId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from('chat-attachments')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return { path: null, url: null, name: file.name, size: file.size };
  }

  const { data: urlData } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(filePath);

  return {
    path: filePath,
    url: urlData.publicUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

// ─── Request AI response via serverless function ───
export async function requestAIResponse(conversationId, userMessage, context = {}) {
  try {
    const res = await fetch(import.meta.env.VITE_SUPPORT_AI_ENDPOINT || '/api/support-chat-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: userMessage,
        context: context,
      }),
    });

    if (!res.ok) throw new Error('AI endpoint error');
    return await res.json();
  } catch (err) {
    console.error('AI response error:', err);
    return null;
  }
}

// ─── Handoff to human agent ───
export async function requestHandoff(conversationId, reason = '') {
  if (!supabase || conversationId.startsWith('demo-')) return null;

  const { data, error } = await supabase
    .from('SupportConversation')
    .update({
      ai_mode: false,
      status: 'waiting_agent',
      handoff_reason: reason,
      handoff_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .select()
    .single();

  if (error) console.error('Handoff error:', error);

  await sendMessage(conversationId, {
    text: "L'utilisateur demande un agent humain.",
    from: 'system',
  });

  return data;
}

// ─── Update conversation status ───
export async function updateConversation(conversationId, updates) {
  if (!supabase || conversationId.startsWith('demo-')) return null;

  const { data, error } = await supabase
    .from('SupportConversation')
    .update(updates)
    .eq('id', conversationId)
    .select()
    .single();

  if (error) console.error('Update conversation error:', error);
  return data;
}
