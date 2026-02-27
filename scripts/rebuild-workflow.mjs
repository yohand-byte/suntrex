/**
 * SUNTREX — Clean Workflow Rebuild
 * Fixes: duplicate node IDs (sx-011 to sx-015) + Signature Valid? IF condition
 * Run: /opt/homebrew/opt/node@22/bin/node scripts/rebuild-workflow.mjs
 */

const API_KEY = 'n8n_api_ac504f192e4cdd1eb95ccb8b6d7237999e44b199ad78879876c7dcb19569cd28750d74f9bb6a66e6';
const N8N = 'http://localhost:5678';
const WF_ID = 'wnarPrvFAgYu0rmF';
const SUPABASE = 'https://uigoadkslyztxgzahmwv.supabase.co';

const ok  = s => console.log('  ✅ ' + s);
const err = s => console.log('  ❌ ' + s);

// ── CLEAN 28-NODE WORKFLOW ────────────────────────────────────────────────────

const nodes = [
  // ── ENTRY ──
  {
    id: 'sx-001', name: 'stripe-webhook-entry',
    type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [240, 400],
    parameters: { httpMethod: 'POST', path: 'stripe-webhook-entry', responseMode: 'responseNode', options: { rawBody: true } }
  },
  {
    id: 'sx-002', name: 'ACK Stripe 200',
    type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1, position: [480, 220],
    parameters: { respondWith: 'json', responseBody: '={"received":true}', options: { responseCode: 200 } }
  },

  // ── SIGNATURE VERIFICATION ──
  {
    id: 'sx-003', name: 'Verify Stripe Signature',
    type: 'n8n-nodes-base.code', typeVersion: 2, position: [480, 400],
    parameters: {
      jsCode: `// SUNTREX — Stripe Signature Verification (SubtleCrypto, no require)

const rawBody = $json.body ? JSON.stringify($json.body) : '';
const sigHeader = ($json.headers || {})['stripe-signature'] || '';
const webhookSecret = $vars.STRIPE_WEBHOOK_SECRET || '';

// Dev bypass: no secret configured → skip (DEV ONLY)
if (!webhookSecret) {
  let stripeEvent;
  try { stripeEvent = typeof $json.body === 'object' ? $json.body : JSON.parse(rawBody); }
  catch(e) { return [{ json: { valid: false, error: 'Cannot parse body', stripeEvent: null } }]; }
  return [{ json: { valid: true, error: null, eventType: stripeEvent.type, eventId: stripeEvent.id, stripeEvent } }];
}

if (!sigHeader) {
  return [{ json: { valid: false, error: 'Missing stripe-signature header', stripeEvent: null } }];
}

const parts = {};
sigHeader.split(',').forEach(part => {
  const [k, ...rest] = part.split('=');
  parts[k.trim()] = rest.join('=').trim();
});
const timestamp = parts['t'];
const receivedSig = parts['v1'];

if (!timestamp || !receivedSig) {
  return [{ json: { valid: false, error: 'Malformed stripe-signature', stripeEvent: null } }];
}

const ageSec = Math.floor(Date.now() / 1000) - parseInt(timestamp);
if (ageSec > 300) {
  return [{ json: { valid: false, error: 'Replay detected: ' + ageSec + 's old (max 300s)', stripeEvent: null } }];
}

const secretBase64 = webhookSecret.replace('whsec_', '');
const secretBytes = Uint8Array.from(atob(secretBase64), c => c.charCodeAt(0));
const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);

const encoder = new TextEncoder();
const signedPayload = timestamp + '.' + rawBody;
const receivedBytes = Uint8Array.from(receivedSig.match(/.{2}/g).map(b => parseInt(b, 16)));
const sigValid = await crypto.subtle.verify('HMAC', key, receivedBytes, encoder.encode(signedPayload));

if (!sigValid) {
  return [{ json: { valid: false, error: 'Signature mismatch', stripeEvent: null } }];
}

let stripeEvent;
try { stripeEvent = typeof $json.body === 'object' ? $json.body : JSON.parse(rawBody); }
catch(e) { return [{ json: { valid: false, error: 'Cannot parse body', stripeEvent: null } }]; }

return [{ json: { valid: true, error: null, eventType: stripeEvent.type, eventId: stripeEvent.id, stripeEvent } }];`
    }
  },

  // ── FIX: use isTrue instead of boolean.equal (was routing to wrong branch) ──
  {
    id: 'sx-004', name: 'Signature Valid?',
    type: 'n8n-nodes-base.if', typeVersion: 2, position: [720, 400],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          id: 'sig-check',
          leftValue: '={{ $json.valid }}',
          rightValue: '',
          operator: { type: 'boolean', operation: 'isTrue' }
        }],
        combinator: 'and'
      },
      options: {}
    }
  },

  // ── INVALID SIGNATURE ──
  {
    id: 'sx-005', name: 'Log Invalid Signature',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [960, 600],
    parameters: {
      method: 'POST', url: `=${SUPABASE}/rest/v1/transaction_events`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=minimal' }
      ]},
      sendBody: true, specifyBody: 'json',
      jsonBody: '={"transaction_id":null,"actor_id":null,"event_type":"stripe.webhook.invalid_signature","payload":{"error":"{{ $json.error }}","timestamp":"{{ new Date().toISOString() }}"}}',
      options: {}
    }
  },

  // ── ROUTING ──
  {
    id: 'sx-006', name: 'Route by Event Type',
    type: 'n8n-nodes-base.switch', typeVersion: 3, position: [960, 400],
    parameters: {
      rules: { values: [
        { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.eventType }}', rightValue: 'payment_intent.succeeded', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'payment_succeeded' },
        { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.eventType }}', rightValue: 'payment_intent.payment_failed', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'payment_failed' },
        { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.eventType }}', rightValue: 'charge.dispute.created', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'dispute_created' },
        { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.eventType }}', rightValue: 'charge.refunded', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'charge_refunded' },
        { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.eventType }}', rightValue: 'account.updated', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'account_updated' }
      ]},
      options: {}
    }
  },

  // ── PAYMENT SUCCEEDED PATH ──
  {
    id: 'sx-007', name: 'Validate & Extract Metadata',
    type: 'n8n-nodes-base.code', typeVersion: 2, position: [1200, 240],
    parameters: {
      jsCode: `const event = $json.stripeEvent;
const pi = event?.data?.object;

if (!pi || pi.object !== 'payment_intent') {
  throw new Error('[SUNTREX] Expected payment_intent object, got: ' + pi?.object);
}

const meta = pi.metadata || {};
const transactionId = meta.order_id || meta.transaction_id;
const buyerId = meta.buyer_id;
const sellerId = meta.seller_id;

if (!transactionId) throw new Error('[SUNTREX] Missing metadata.order_id in PaymentIntent ' + pi.id);
if (!buyerId) throw new Error('[SUNTREX] Missing metadata.buyer_id in PaymentIntent ' + pi.id);
if (!sellerId) throw new Error('[SUNTREX] Missing metadata.seller_id in PaymentIntent ' + pi.id);

const amountCents = pi.amount;
if (!amountCents || amountCents < 10000 || amountCents > 50000000) {
  throw new Error('[SUNTREX] Unexpected amount: ' + amountCents + ' cents');
}

const currency = (pi.currency || '').toLowerCase();
const allowedCurrencies = ['eur', 'gbp', 'chf', 'pln'];
if (!allowedCurrencies.includes(currency)) throw new Error('[SUNTREX] Unsupported currency: ' + currency);

return [{ json: {
  transactionId, buyerId, sellerId,
  paymentIntentId: pi.id,
  chargeId: pi.latest_charge,
  amountCents,
  feeCents: pi.application_fee_amount || 0,
  currency,
  stripeAccountDestination: pi.transfer_data?.destination || null,
  eventId: $json.eventId,
  eventType: $json.eventType,
  processedAt: new Date().toISOString()
} }];`
    }
  },
  {
    id: 'sx-008', name: 'Check Event Already Processed',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1440, 240],
    parameters: {
      method: 'GET',
      url: `=${SUPABASE}/rest/v1/transaction_events?event_type=eq.payment.succeeded&payload->>stripe_event_id=eq.{{ $json.eventId }}&select=id`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=representation' }
      ]},
      options: {}
    }
  },
  {
    id: 'sx-009', name: 'Event Already Processed?',
    type: 'n8n-nodes-base.code', typeVersion: 2, position: [1680, 240],
    parameters: {
      jsCode: `const rows = $input.all();
const prevItem = $('Validate & Extract Metadata').first().json;
const existingRows = Array.isArray(rows[0]?.json) ? rows[0].json : [];

if (existingRows.length > 0) {
  return [{ json: { duplicate: true, reason: 'Stripe event ' + prevItem.eventId + ' already processed', ...prevItem } }];
}
return [{ json: { duplicate: false, ...prevItem } }];`
    }
  },
  {
    id: 'sx-010', name: 'Skip Duplicate?',
    type: 'n8n-nodes-base.if', typeVersion: 2, position: [1920, 240],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ id: 'dup-check', leftValue: '={{ $json.duplicate }}', rightValue: false, operator: { type: 'boolean', operation: 'equal' } }],
        combinator: 'and'
      },
      options: {}
    }
  },
  {
    id: 'sx-011', name: 'Update Order PAID',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [2160, 160],
    parameters: {
      method: 'PATCH',
      url: `=${SUPABASE}/rest/v1/Order?id=eq.{{ $json.transactionId }}`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=minimal' }
      ]},
      sendBody: true, specifyBody: 'json',
      jsonBody: '={"status":"paid","payment_intent_id":"{{ $json.paymentIntentId }}","charge_id":"{{ $json.chargeId }}","paid_at":"{{ $json.processedAt }}","updated_at":"{{ $json.processedAt }}"}',
      options: {}
    }
  },
  {
    id: 'sx-012', name: 'Log Payment Succeeded',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [2400, 160],
    parameters: {
      method: 'POST',
      url: `=${SUPABASE}/rest/v1/transaction_events`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=minimal' }
      ]},
      sendBody: true, specifyBody: 'json',
      jsonBody: `={"transaction_id":"{{ $json.transactionId }}","actor_id":null,"event_type":"payment.succeeded","payload":{"stripe_event_id":"{{ $json.eventId }}","payment_intent_id":"{{ $json.paymentIntentId }}","charge_id":"{{ $json.chargeId }}","amount_cents":{{ $json.amountCents }},"fee_cents":{{ $json.feeCents }},"currency":"{{ $json.currency }}","processed_at":"{{ $json.processedAt }}"}}`,
      options: {}
    }
  },
  {
    id: 'sx-013', name: 'Prepare Buyer Seller Notifications',
    type: 'n8n-nodes-base.code', typeVersion: 2, position: [2640, 160],
    parameters: {
      jsCode: `const d = $json;
const amountEur = (d.amountCents / 100).toFixed(2);
const feeEur = (d.feeCents / 100).toFixed(2);
const netEur = ((d.amountCents - d.feeCents) / 100).toFixed(2);
const shortId = (d.transactionId || '').substring(0, 8).toUpperCase();

const buyerNotif = {
  user_id: d.buyerId,
  message: 'Paiement confirme pour commande #' + shortId + ' — ' + amountEur + ' ' + d.currency.toUpperCase() + '. Livraison en cours.',
  metadata: JSON.stringify({ type: 'payment_succeeded', transaction_id: d.transactionId, amount_cents: d.amountCents, currency: d.currency })
};

const sellerNotif = {
  user_id: d.sellerId,
  message: 'Paiement recu pour commande #' + shortId + ' — net ' + netEur + ' ' + d.currency.toUpperCase() + ' (apres commission ' + feeEur + ').',
  metadata: JSON.stringify({ type: 'payment_received', transaction_id: d.transactionId, net_cents: d.amountCents - d.feeCents, currency: d.currency })
};

return [{ json: { buyerNotif, sellerNotif, ...d } }];`
    }
  },
  {
    id: 'sx-014', name: 'Notify Buyer Payment Confirmed',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [2880, 80],
    parameters: {
      method: 'POST', url: `=${SUPABASE}/rest/v1/Notification`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=minimal' }
      ]},
      sendBody: true, specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.buyerNotif) }}',
      options: {}
    }
  },
  {
    id: 'sx-015', name: 'Notify Seller Payment Received',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [2880, 240],
    parameters: {
      method: 'POST', url: `=${SUPABASE}/rest/v1/Notification`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=minimal' }
      ]},
      sendBody: true, specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.sellerNotif) }}',
      options: {}
    }
  },

  // ── PAYMENT FAILED PATH ──
  {
    id: 'sx-016', name: 'Extract Failed Payment Data',
    type: 'n8n-nodes-base.code', typeVersion: 2, position: [1200, 400],
    parameters: {
      jsCode: `const pi = $json.stripeEvent?.data?.object || {};
const meta = pi.metadata || {};
const transactionId = meta.order_id || meta.transaction_id;
const buyerId = meta.buyer_id;
const failureCode = pi.last_payment_error?.code || 'unknown';
const failureMessage = pi.last_payment_error?.message || 'Payment failed';

if (!transactionId) {
  return [{ json: { skipped: true, reason: 'No transaction_id in metadata', eventId: $json.eventId } }];
}

return [{ json: { transactionId, buyerId, paymentIntentId: pi.id, failureCode, failureMessage, eventId: $json.eventId, processedAt: new Date().toISOString() } }];`
    }
  },
  {
    id: 'sx-017', name: 'Update Order FAILED',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1440, 400],
    parameters: {
      method: 'PATCH',
      url: `=${SUPABASE}/rest/v1/Order?id=eq.{{ $json.transactionId }}`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=minimal' }
      ]},
      sendBody: true, specifyBody: 'json',
      jsonBody: '={"status":"payment_failed","failure_code":"{{ $json.failureCode }}","updated_at":"{{ $json.processedAt }}"}',
      options: {}
    }
  },
  {
    id: 'sx-018', name: 'Log Payment Failed',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1680, 400],
    parameters: {
      method: 'POST', url: `=${SUPABASE}/rest/v1/transaction_events`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=minimal' }
      ]},
      sendBody: true, specifyBody: 'json',
      jsonBody: `={"transaction_id":"{{ $json.transactionId }}","actor_id":null,"event_type":"payment.failed","payload":{"stripe_event_id":"{{ $json.eventId }}","payment_intent_id":"{{ $json.paymentIntentId }}","failure_code":"{{ $json.failureCode }}","failure_message":"{{ $json.failureMessage }}","processed_at":"{{ $json.processedAt }}"}}`,
      options: {}
    }
  },
  {
    id: 'sx-019', name: 'Prepare Failed Notification',
    type: 'n8n-nodes-base.code', typeVersion: 2, position: [1920, 400],
    parameters: {
      jsCode: `const d = $json;
const shortId = (d.transactionId || '').substring(0, 8).toUpperCase();
const notification = {
  user_id: d.buyerId,
  message: 'Paiement echoue pour commande #' + shortId + ' (' + d.failureCode + '). Verifiez votre moyen de paiement.',
  metadata: JSON.stringify({ type: 'payment_failed', transaction_id: d.transactionId, failure_code: d.failureCode })
};
return [{ json: { notification } }];`
    }
  },
  {
    id: 'sx-020', name: 'Notify Buyer Payment Failed',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [2160, 400],
    parameters: {
      method: 'POST', url: `=${SUPABASE}/rest/v1/Notification`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=minimal' }
      ]},
      sendBody: true, specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.notification) }}',
      options: {}
    }
  },

  // ── DISPUTE PATH ──
  {
    id: 'sx-021', name: 'Mark Order Disputed',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1200, 580],
    parameters: {
      method: 'PATCH',
      url: `=${SUPABASE}/rest/v1/Order?payment_intent_id=eq.{{ $json.stripeEvent.data.object.payment_intent }}`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=minimal' }
      ]},
      sendBody: true, specifyBody: 'json',
      jsonBody: '={"status":"disputed","disputed_at":"{{ new Date().toISOString() }}","updated_at":"{{ new Date().toISOString() }}"}',
      options: {}
    }
  },
  {
    id: 'sx-022', name: 'Log Dispute Event',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1440, 580],
    parameters: {
      method: 'POST', url: `=${SUPABASE}/rest/v1/transaction_events`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=minimal' }
      ]},
      sendBody: true, specifyBody: 'json',
      jsonBody: `={"transaction_id":null,"actor_id":null,"event_type":"charge.dispute.created","payload":{"stripe_event_id":"{{ $json.eventId }}","dispute_id":"{{ $json.stripeEvent.data.object.id }}","charge_id":"{{ $json.stripeEvent.data.object.charge }}","reason":"{{ $json.stripeEvent.data.object.reason }}","amount":{{ $json.stripeEvent.data.object.amount }},"processed_at":"{{ new Date().toISOString() }}"}}`,
      options: {}
    }
  },

  // ── REFUND PATH ──
  {
    id: 'sx-023', name: 'Extract Refund Data',
    type: 'n8n-nodes-base.code', typeVersion: 2, position: [1200, 720],
    parameters: {
      jsCode: `const charge = $json.stripeEvent?.data?.object || {};
const refunds = charge.refunds?.data || [];
const totalRefunded = charge.amount_refunded || 0;
const paymentIntentId = charge.payment_intent;

return [{ json: {
  paymentIntentId, chargeId: charge.id,
  totalRefundedCents: totalRefunded,
  refundCount: refunds.length,
  isFullRefund: totalRefunded >= charge.amount,
  currency: charge.currency,
  eventId: $json.eventId,
  processedAt: new Date().toISOString()
} }];`
    }
  },
  {
    id: 'sx-024', name: 'Update Order REFUNDED',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1440, 720],
    parameters: {
      method: 'PATCH',
      url: `=${SUPABASE}/rest/v1/Order?payment_intent_id=eq.{{ $json.paymentIntentId }}`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=minimal' }
      ]},
      sendBody: true, specifyBody: 'json',
      jsonBody: '={"status":"{{ $json.isFullRefund ? \'refunded\' : \'partially_refunded\' }}","refunded_amount_cents":{{ $json.totalRefundedCents }},"updated_at":"{{ $json.processedAt }}"}',
      options: {}
    }
  },
  {
    id: 'sx-025', name: 'Log Refund Event',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1680, 720],
    parameters: {
      method: 'POST', url: `=${SUPABASE}/rest/v1/transaction_events`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=minimal' }
      ]},
      sendBody: true, specifyBody: 'json',
      jsonBody: `={"transaction_id":null,"actor_id":null,"event_type":"{{ $('Extract Refund Data').first().json.isFullRefund ? 'charge.refunded.full' : 'charge.refunded.partial' }}","payload":{"stripe_event_id":"{{ $('Extract Refund Data').first().json.eventId }}","charge_id":"{{ $('Extract Refund Data').first().json.chargeId }}","payment_intent_id":"{{ $('Extract Refund Data').first().json.paymentIntentId }}","refunded_cents":{{ $('Extract Refund Data').first().json.totalRefundedCents }},"currency":"{{ $('Extract Refund Data').first().json.currency }}","processed_at":"{{ $('Extract Refund Data').first().json.processedAt }}"}}`,
      options: {}
    }
  },

  // ── KYC PATH ──
  {
    id: 'sx-026', name: 'Update Company KYC Status',
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1200, 900],
    parameters: {
      method: 'PATCH',
      url: `=${SUPABASE}/rest/v1/Company?stripe_account_id=eq.{{ $json.stripeEvent.data.object.id }}`,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'apikey', value: '={{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Authorization', value: '=Bearer {{ $vars.SUPABASE_SERVICE_ROLE_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Prefer', value: 'return=minimal' }
      ]},
      sendBody: true, specifyBody: 'json',
      jsonBody: '={"stripe_charges_enabled":{{ $json.stripeEvent.data.object.charges_enabled }},"stripe_payouts_enabled":{{ $json.stripeEvent.data.object.payouts_enabled }},"kyc_status":"{{ $json.stripeEvent.data.object.charges_enabled && $json.stripeEvent.data.object.payouts_enabled ? \'verified\' : \'pending\' }}","updated_at":"{{ new Date().toISOString() }}"}',
      options: {}
    }
  },

  // ── SKIP DUPLICATE ──
  {
    id: 'sx-027', name: 'Skip Already Processed',
    type: 'n8n-nodes-base.code', typeVersion: 2, position: [2160, 340],
    parameters: {
      jsCode: `const d = $json;
return [{ json: { skipped: true, reason: d.reason, eventId: d.eventId, transactionId: d.transactionId } }];`
    }
  }
];

// ── CONNECTIONS ───────────────────────────────────────────────────────────────
const connections = {
  'stripe-webhook-entry': { main: [[
    { node: 'ACK Stripe 200', type: 'main', index: 0 },
    { node: 'Verify Stripe Signature', type: 'main', index: 0 }
  ]] },
  'Verify Stripe Signature': { main: [[{ node: 'Signature Valid?', type: 'main', index: 0 }]] },
  // output 0 = TRUE (valid), output 1 = FALSE (invalid)
  'Signature Valid?': { main: [
    [{ node: 'Route by Event Type', type: 'main', index: 0 }],     // 0 = isTrue
    [{ node: 'Log Invalid Signature', type: 'main', index: 0 }]   // 1 = isFalse
  ]},
  'Route by Event Type': { main: [
    [{ node: 'Validate & Extract Metadata', type: 'main', index: 0 }],  // 0 = payment_succeeded
    [{ node: 'Extract Failed Payment Data', type: 'main', index: 0 }],  // 1 = payment_failed
    [{ node: 'Mark Order Disputed', type: 'main', index: 0 }],          // 2 = dispute_created
    [{ node: 'Extract Refund Data', type: 'main', index: 0 }],          // 3 = charge_refunded
    [{ node: 'Update Company KYC Status', type: 'main', index: 0 }]     // 4 = account_updated
  ]},
  'Validate & Extract Metadata': { main: [[{ node: 'Check Event Already Processed', type: 'main', index: 0 }]] },
  'Check Event Already Processed': { main: [[{ node: 'Event Already Processed?', type: 'main', index: 0 }]] },
  'Event Already Processed?': { main: [[{ node: 'Skip Duplicate?', type: 'main', index: 0 }]] },
  'Skip Duplicate?': { main: [
    [{ node: 'Update Order PAID', type: 'main', index: 0 }],         // 0 = not duplicate → proceed
    [{ node: 'Skip Already Processed', type: 'main', index: 0 }]    // 1 = duplicate → skip
  ]},
  'Update Order PAID': { main: [[{ node: 'Log Payment Succeeded', type: 'main', index: 0 }]] },
  'Log Payment Succeeded': { main: [[{ node: 'Prepare Buyer Seller Notifications', type: 'main', index: 0 }]] },
  'Prepare Buyer Seller Notifications': { main: [[
    { node: 'Notify Buyer Payment Confirmed', type: 'main', index: 0 },
    { node: 'Notify Seller Payment Received', type: 'main', index: 0 }
  ]]},
  'Extract Failed Payment Data': { main: [[{ node: 'Update Order FAILED', type: 'main', index: 0 }]] },
  'Update Order FAILED': { main: [[{ node: 'Log Payment Failed', type: 'main', index: 0 }]] },
  'Log Payment Failed': { main: [[{ node: 'Prepare Failed Notification', type: 'main', index: 0 }]] },
  'Prepare Failed Notification': { main: [[{ node: 'Notify Buyer Payment Failed', type: 'main', index: 0 }]] },
  'Mark Order Disputed': { main: [[{ node: 'Log Dispute Event', type: 'main', index: 0 }]] },
  'Extract Refund Data': { main: [[{ node: 'Update Order REFUNDED', type: 'main', index: 0 }]] },
  'Update Order REFUNDED': { main: [[{ node: 'Log Refund Event', type: 'main', index: 0 }]] }
};

// ── PUSH TO N8N ───────────────────────────────────────────────────────────────
console.log('\n━━━ SUNTREX — Clean Workflow Rebuild ━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('  Nodes to push:', nodes.length, '(unique IDs, no duplicates)');

const payload = {
  name: 'SUNTREX — Stripe Payment Flow (Core Revenue)',
  nodes,
  connections,
  settings: {
    executionOrder: 'v1',
    saveManualExecutions: true,
    timezone: 'Europe/Paris',
    errorWorkflow: '0Q23FXcq1VsHZgrr'
  }
};

const res = await fetch(`${N8N}/api/v1/workflows/${WF_ID}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': API_KEY },
  body: JSON.stringify(payload)
});

const data = await res.json();
if (res.status !== 200) {
  err('PUT failed (' + res.status + '): ' + JSON.stringify(data).slice(0, 300));
  process.exit(1);
}

const nodeCount = data.nodes?.length || 0;
ok('Workflow rebuilt: ' + nodeCount + ' nodes');

// Re-activate
const actRes = await fetch(`${N8N}/api/v1/workflows/${WF_ID}/activate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': API_KEY }
});
actRes.status === 200 ? ok('Workflow ACTIVATED') : err('Activate failed: ' + actRes.status);

console.log('\n━━━ Test curl ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`curl -X POST http://localhost:5678/webhook/wnarPrvFAgYu0rmF/stripe-webhook-entry \\
  -H "Content-Type: application/json" \\
  -d '{"id":"evt_test_clean","type":"payment_intent.succeeded","data":{"object":{"id":"pi_test","object":"payment_intent","amount":250000,"currency":"eur","application_fee_amount":12500,"metadata":{"order_id":"order-uuid-test","buyer_id":"buyer-uuid-test","seller_id":"seller-uuid-test"}}}}'`);
