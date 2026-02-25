# CLAUDE.md — SUNTREX Support Chat Module

> Rules specific to `src/components/chat/`. Inherits all global rules from root `CLAUDE.md`.

## Architecture

```
src/components/chat/
├── SuntrexSupportChat.jsx    # Main UI component (widget)
├── supportChatService.js     # Supabase CRUD + realtime + storage
├── useSupportChat.js         # React hook orchestrating state
└── CLAUDE.md                 # ← THIS FILE
```

## Component Behavior

### Floating Widget
- **Position**: fixed bottom-right, `z-index: 10000`
- **Mobile**: button 48px, widget `calc(100% - 16px)` width, full height minus safe area
- **Desktop**: button 56px, widget 400x620px
- **Animation**: slide-up on open, scale-in on button

### Views
1. **Home view**: welcome message, 6 FAQ quick actions, multi-channel links (WhatsApp, Email, Phone), online agents list
2. **Chat view**: message history, AI/agent indicator, typing animation, file attachments, input bar

### AI Mode
- Default: `aiMode = true` — Claude responds via `/api/support-chat-ai`
- Handoff triggers: user clicks "Parler à un humain" OR AI detects complex issue
- On handoff: `aiMode = false`, conversation status → `waiting_agent`

### Graceful Degradation
- **If Supabase not configured**: widget runs in demo mode with hardcoded responses
- **If AI endpoint unavailable**: show error message, offer direct channels (WhatsApp, email)
- **If no agents online**: show estimated response time, suggest email

## Supabase Tables Used

| Table | Operations | Realtime |
|-------|-----------|----------|
| SupportConversation | CRUD | ✅ Subscribe |
| SupportMessage | Read, Insert | ✅ Subscribe |
| SupportAgent | Read only | ❌ |
| SupportCannedResponse | Read only | ❌ |

### Realtime Subscriptions
```js
// Subscribe to new messages in current conversation
supabase
  .channel(`messages:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'SupportMessage',
    filter: `conversation_id=eq.${conversationId}`
  }, handleNewMessage)
  .subscribe();
```

## File Attachments
- **Storage bucket**: `chat-attachments` (private)
- **Max size**: 10MB per file
- **Allowed types**: images (jpg, png, gif, webp), PDF, Office docs (docx, xlsx)
- **Path pattern**: `{conversationId}/{timestamp}_{filename}`
- **Preview**: show thumbnail before send, progress bar during upload

## Security Rules
- Users can only read messages from their OWN conversations
- Users can only INSERT messages with `sender_type = 'user'`
- Agents can read ALL conversations and insert `agent`/`system` messages
- AI messages are inserted SERVER-SIDE via service_role (Netlify function)
- **Moderation**: detect off-platform payment requests, personal info sharing, inappropriate language
- **Never expose**: Supabase service_role key, Anthropic API key in client code

## Styling
- Uses `BRAND` color constants from root component
- Orange (#f97316) for primary actions, send button, branding
- Dark (#1e293b) for text
- Green (#10b981) for online status, success
- All styles inline (no Tailwind, no CSS modules)
- **Must be responsive**: widget adapts from 375px to 1440px

## Testing Checklist
- [ ] Widget opens/closes smoothly on mobile and desktop
- [ ] Messages appear in realtime (both AI and human)
- [ ] File upload works with preview
- [ ] Handoff from AI to human works
- [ ] Demo mode works without Supabase
- [ ] No horizontal overflow on mobile
- [ ] Typing indicator shows during AI response
- [ ] FAQ quick actions send correct messages
