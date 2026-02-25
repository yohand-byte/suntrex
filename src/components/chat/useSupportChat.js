import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getOrCreateConversation,
  sendMessage,
  loadMessages,
  subscribeToMessages,
  uploadAttachment,
  requestAIResponse,
  requestHandoff,
  updateConversation,
} from './supportChatService';

export function useSupportChat(userId = null) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const subRef = useRef(null);

  // Init conversation
  const initConversation = useCallback(async (metadata = {}) => {
    setIsLoading(true);
    const conv = await getOrCreateConversation(userId, metadata);
    setConversation(conv);

    if (!conv.isDemo) {
      const history = await loadMessages(conv.id);
      setMessages(history.map(m => ({
        id: m.id,
        from: m.sender_type,
        text: m.content,
        attachments: m.attachments,
        time: new Date(m.created_at),
        agentId: m.sender_id,
      })));

      setAiMode(conv.ai_mode !== false);

      // Subscribe to realtime
      subRef.current = subscribeToMessages(conv.id, (newMsg) => {
        if (newMsg.sender_type !== 'user') {
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, {
              id: newMsg.id,
              from: newMsg.sender_type,
              text: newMsg.content,
              attachments: newMsg.attachments,
              time: new Date(newMsg.created_at),
              agentId: newMsg.sender_id,
            }];
          });
          setIsTyping(false);
        }
      });
    }
    setIsLoading(false);
    return conv;
  }, [userId]);

  // Send message
  const send = useCallback(async (text, attachmentFiles = []) => {
    if (!conversation) return;

    // Upload attachments first
    const uploadedAtts = [];
    for (const file of attachmentFiles) {
      const att = await uploadAttachment(conversation.id, file);
      uploadedAtts.push(att);
    }

    // Add to local state immediately (optimistic)
    const localMsg = {
      id: 'local-' + Date.now(),
      from: 'user',
      text,
      attachments: uploadedAtts,
      time: new Date(),
    };
    setMessages(prev => [...prev, localMsg]);

    // Send to Supabase
    await sendMessage(conversation.id, {
      text,
      from: 'user',
      attachments: uploadedAtts,
    });

    // If AI mode, request AI response
    if (aiMode) {
      setIsTyping(true);
      const aiResponse = await requestAIResponse(conversation.id, text, {
        userId,
        language: 'FR',
        previousMessages: messages.slice(-5).map(m => ({ role: m.from, content: m.text })),
      });

      if (aiResponse?.messages) {
        for (const msg of aiResponse.messages) {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, {
              id: msg.id || 'ai-' + Date.now(),
              from: 'ai',
              text: msg.text,
              time: new Date(),
              handoff: msg.handoff,
            }];
          });
        }
        setIsTyping(false);
      } else {
        // Fallback: AI endpoint down
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: 'ai-fallback-' + Date.now(),
            from: 'ai',
            text: "Merci pour votre message. Un agent va vous r\u00e9pondre sous peu.",
            time: new Date(),
            handoff: true,
          }]);
          setIsTyping(false);
        }, 1500);
      }
    }
  }, [conversation, aiMode, userId, messages]);

  // Handoff to human
  const handoffToHuman = useCallback(async (reason = '') => {
    if (!conversation) return;
    setAiMode(false);
    setIsTyping(true);
    await requestHandoff(conversation.id, reason);
  }, [conversation]);

  // Revert to AI mode (cancel handoff)
  const revertToAI = useCallback(async () => {
    if (!conversation) return;
    setAiMode(true);
    if (!conversation.isDemo) {
      await updateConversation(conversation.id, {
        ai_mode: true,
        status: 'open',
        handoff_reason: null,
        handoff_at: null,
      });
    }
  }, [conversation]);

  // Close conversation (mark as closed in Supabase)
  const closeConversation = useCallback(async () => {
    if (!conversation) return;
    if (!conversation.isDemo) {
      await updateConversation(conversation.id, { status: 'closed' });
    }
    if (subRef.current) {
      subRef.current.unsubscribe();
      subRef.current = null;
    }
    setConversation(null);
    setMessages([]);
    setAiMode(true);
    setIsTyping(false);
  }, [conversation]);

  // Reset chat (new conversation without closing old one)
  const resetChat = useCallback(() => {
    if (subRef.current) {
      subRef.current.unsubscribe();
      subRef.current = null;
    }
    setConversation(null);
    setMessages([]);
    setAiMode(true);
    setIsTyping(false);
    setIsLoading(false);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (subRef.current) subRef.current.unsubscribe();
    };
  }, []);

  return {
    conversation,
    messages,
    isLoading,
    isTyping,
    aiMode,
    initConversation,
    send,
    handoffToHuman,
    revertToAI,
    closeConversation,
    resetChat,
    setIsTyping,
  };
}
