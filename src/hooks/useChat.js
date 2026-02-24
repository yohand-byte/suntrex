// src/hooks/useChat.js
// Real-time chat hook — Supabase Realtime subscriptions
// Handles: fetch, subscribe, optimistic send, moderation status updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, apiFetch } from '../lib/supabase';

export function useChat(transactionId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const channelRef = useRef(null);

  // ── Fetch existing messages ──────────────────────────────
  useEffect(() => {
    if (!transactionId) return;

    async function fetchMessages() {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
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

        if (fetchError) throw fetchError;
        setMessages(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [transactionId]);

  // ── Realtime subscription ────────────────────────────────
  useEffect(() => {
    if (!transactionId) return;

    const channel = supabase
      .channel(`chat:${transactionId}`)
      // New messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `transaction_id=eq.${transactionId}`,
        },
        async (payload) => {
          // Fetch full message with joined data
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id (
                id, company_name, country_code, role, avatar_url, badges
              ),
              attachments:message_attachments (*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => {
              // Replace optimistic message or add new
              const existing = prev.findIndex(
                (m) => m.id === data.id || m._optimisticId === data.id
              );
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = { ...data, _optimistic: false };
                return updated;
              }
              return [...prev, data];
            });
          }
        }
      )
      // Message updates (moderation, edits)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `transaction_id=eq.${transactionId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id ? { ...m, ...payload.new } : m
            )
          );
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setError('Realtime connection error. Retrying...');
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactionId]);

  // ── Send message ─────────────────────────────────────────
  const sendMessage = useCallback(
    async (body, options = {}) => {
      if (!body.trim() || sending) return null;

      setSending(true);
      setError(null);

      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) {
        setError('Session expirée. Reconnectez-vous.');
        setSending(false);
        return null;
      }

      // Optimistic message
      const optimisticId = crypto.randomUUID();
      const optimisticMsg = {
        id: optimisticId,
        _optimistic: true,
        _optimisticId: optimisticId,
        transaction_id: transactionId,
        sender_id: currentUser.id,
        body: body.trim(),
        original_lang: options.lang || 'fr',
        moderation_status: 'pending',
        created_at: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          company_name: 'Vous',
          country_code: null,
          role: null,
        },
        attachments: [],
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const result = await apiFetch('/api/messages/send', {
          method: 'POST',
          body: JSON.stringify({
            transaction_id: transactionId,
            body: body.trim(),
            lang: options.lang || 'fr',
            reply_to: options.replyTo || null,
          }),
        });

        // Replace optimistic with real message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? { ...result, _optimistic: false }
              : m
          )
        );

        setSending(false);
        return result;
      } catch (err) {
        // Remove optimistic on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setError(`Échec de l'envoi: ${err.message}`);
        setSending(false);
        return null;
      }
    },
    [transactionId, sending]
  );

  // ── Typing indicator (via Supabase Realtime Presence) ────
  const sendTyping = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: supabase.auth.getUser()?.id },
      });
    }
  }, []);

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    sendTyping,
  };
}
