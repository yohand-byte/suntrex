/**
 * SUNTREX — Client-side chat moderation filter
 *
 * Detects off-platform payment attempts, personal contact info sharing,
 * and inappropriate language in buyer-seller chat messages.
 *
 * Returns { blocked, reason } — if blocked, the message should NOT be sent.
 * This is a first line of defense; server-side moderation (Netlify Function)
 * is the authoritative filter.
 */

// ── Keyword lists ────────────────────────────────────────────

const PAYMENT_BYPASS = [
  "paypal", "virement direct", "wire transfer", "western union",
  "crypto", "bitcoin", "btc", "eth", "usdt", "payer en dehors",
  "pay outside", "hors plateforme", "off platform", "direct payment",
  "cash", "espèce", "liquide", "sans commission", "without commission",
  "sans frais", "without fees", "paiement direct", "bank transfer",
  "transfert bancaire", "iban", "bic", "swift",
];

const CONTACT_SHARING = [
  "whatsapp", "telegram", "signal", "viber",
  "mon numéro", "my number", "appelle-moi", "call me",
  "contacte-moi sur", "contact me on", "mon email perso",
  "email personnel", "personal email", "hors chat",
  "en privé", "in private", "facebook", "instagram",
  "linkedin", "skype", "zoom perso",
];

const INAPPROPRIATE = [
  "arnaque", "scam", "escroquerie", "fraud",
  "menace", "threat", "menacer", "threaten",
  "connard", "enculé", "putain", "merde", "fuck",
  "shit", "asshole", "bastard", "idiot", "imbécile",
];

// ── Phone / email regex patterns ─────────────────────────────

const PHONE_REGEX = /(?:\+?\d{1,4}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,6}/;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const IBAN_REGEX = /[A-Z]{2}\d{2}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}/i;

// ── Main filter function ─────────────────────────────────────

/**
 * @param {string} text — the raw message text
 * @returns {{ blocked: boolean, reason: string|null, category: string|null }}
 */
export function filterMessage(text) {
  if (!text || typeof text !== "string") {
    return { blocked: false, reason: null, category: null };
  }

  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Payment bypass detection
  for (const kw of PAYMENT_BYPASS) {
    const kwNorm = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lower.includes(kwNorm)) {
      return {
        blocked: true,
        reason: "Les paiements hors plateforme ne sont pas autorisés. Utilisez le système de paiement sécurisé SUNTREX.",
        category: "payment_bypass",
      };
    }
  }

  // 2. IBAN detection
  if (IBAN_REGEX.test(text)) {
    return {
      blocked: true,
      reason: "Le partage de coordonnées bancaires (IBAN) n'est pas autorisé dans le chat.",
      category: "payment_bypass",
    };
  }

  // 3. Contact info sharing
  for (const kw of CONTACT_SHARING) {
    const kwNorm = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lower.includes(kwNorm)) {
      return {
        blocked: true,
        reason: "Le partage de coordonnées personnelles n'est pas autorisé. Utilisez le chat SUNTREX pour toutes vos communications.",
        category: "contact_sharing",
      };
    }
  }

  // 4. Phone number detection (≥8 digits in sequence)
  const digitsOnly = text.replace(/\D/g, "");
  if (digitsOnly.length >= 8 && PHONE_REGEX.test(text)) {
    return {
      blocked: true,
      reason: "Le partage de numéros de téléphone n'est pas autorisé dans le chat.",
      category: "contact_sharing",
    };
  }

  // 5. Email detection
  if (EMAIL_REGEX.test(text)) {
    return {
      blocked: true,
      reason: "Le partage d'adresses email n'est pas autorisé. Utilisez le chat SUNTREX.",
      category: "contact_sharing",
    };
  }

  // 6. Inappropriate language
  for (const kw of INAPPROPRIATE) {
    const kwNorm = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lower.includes(kwNorm)) {
      return {
        blocked: true,
        reason: "Ce message contient du langage inapproprié. Merci de rester professionnel et courtois.",
        category: "inappropriate",
      };
    }
  }

  return { blocked: false, reason: null, category: null };
}
