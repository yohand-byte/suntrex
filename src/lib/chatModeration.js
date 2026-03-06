/**
 * SUNTREX Chat Moderation — Advanced multilingual content analysis
 *
 * Detects: phone numbers, emails, IBANs, external links,
 *          off-platform payment attempts, inappropriate language
 *
 * Score: 0-100 (< 30 OK, 30-70 warning, > 70 blocked)
 */

// Phone number patterns (international + local)
const PHONE_PATTERNS = [
  /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}/g,
  /\b0[1-9][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b/g, // FR
  /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/g, // US/generic
];

// Email pattern
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

// IBAN pattern
const IBAN_PATTERN = /\b[A-Z]{2}\d{2}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{0,4}[\s]?[\dA-Z]{0,4}[\s]?[\dA-Z]{0,2}\b/gi;

// External links (not suntrex)
const LINK_PATTERN = /https?:\/\/(?!.*suntrex)[^\s<]+/gi;

// Off-platform payment keywords (FR, EN, DE, ES, IT, NL)
const PAYMENT_BYPASS_KEYWORDS = {
  fr: ["virement direct", "payer en dehors", "hors plateforme", "paiement direct", "compte bancaire", "envoyez l'argent", "western union", "payez-moi directement"],
  en: ["direct transfer", "pay outside", "off platform", "bank account", "send money", "wire transfer", "pay me directly", "western union"],
  de: ["direktuberweisung", "direkt bezahlen", "ausserhalb der plattform", "bankkonto", "geld senden", "bankuberweisung", "zahlen sie mir direkt"],
  es: ["transferencia directa", "pagar fuera", "fuera de la plataforma", "cuenta bancaria", "enviar dinero", "western union", "pagueme directamente"],
  it: ["bonifico diretto", "pagare fuori", "fuori piattaforma", "conto bancario", "inviare denaro", "western union", "pagatemi direttamente"],
  nl: ["directe overboeking", "buiten het platform", "betaal buiten", "bankrekening", "geld sturen", "western union", "betaal me direct"],
};

// Inappropriate language (multilingual)
const INAPPROPRIATE_KEYWORDS = {
  fr: ["arnaque", "arnaqueur", "escroc", "connard", "merde", "putain", "nique", "enculé"],
  en: ["scam", "scammer", "fraud", "bastard", "shit", "fuck", "asshole", "idiot"],
  de: ["betrug", "betruger", "scheisse", "arschloch", "idiot", "dummkopf"],
  es: ["estafa", "estafador", "mierda", "idiota", "pendejo", "cabron"],
  it: ["truffa", "truffatore", "merda", "coglione", "stronzo", "idiota"],
  nl: ["oplichterij", "oplichter", "klootzak", "idioot", "stom", "kut"],
};

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[0oO]/g, "0")
    .replace(/[1lI]/g, "1")
    .replace(/[@]/g, "a")
    .replace(/[$]/g, "s");
}

function checkPatterns(text) {
  const issues = [];
  let score = 0;

  // Phone numbers
  for (const pattern of PHONE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.some(m => m.replace(/\D/g, "").length >= 8)) {
      issues.push({ type: "phone", severity: "warning", detail: "Phone number detected" });
      score += 25;
      break;
    }
  }

  // Emails
  if (EMAIL_PATTERN.test(text)) {
    issues.push({ type: "email", severity: "warning", detail: "Email address detected" });
    score += 20;
  }

  // IBAN
  if (IBAN_PATTERN.test(text)) {
    issues.push({ type: "iban", severity: "critical", detail: "IBAN detected" });
    score += 40;
  }

  // External links
  if (LINK_PATTERN.test(text)) {
    issues.push({ type: "link", severity: "warning", detail: "External link detected" });
    score += 15;
  }

  return { issues, score };
}

function checkKeywords(text, keywordSets) {
  const normalized = normalizeText(text);
  const issues = [];
  let score = 0;

  for (const [lang, keywords] of Object.entries(keywordSets)) {
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (normalized.includes(normalizedKeyword)) {
        issues.push({ type: "keyword", severity: "critical", detail: `"${keyword}" (${lang})` });
        score += 30;
      }
    }
  }

  return { issues, score };
}

/**
 * Moderate a chat message
 * @param {string} message - The message text
 * @returns {{ score: number, status: 'ok'|'warning'|'blocked', issues: Array, message: string }}
 */
export function moderateMessage(message) {
  if (!message || typeof message !== "string") {
    return { score: 0, status: "ok", issues: [], message };
  }

  const patternResult = checkPatterns(message);
  const paymentResult = checkKeywords(message, PAYMENT_BYPASS_KEYWORDS);
  const inappropriateResult = checkKeywords(message, INAPPROPRIATE_KEYWORDS);

  const allIssues = [
    ...patternResult.issues,
    ...paymentResult.issues.map(i => ({ ...i, type: "payment_bypass" })),
    ...inappropriateResult.issues.map(i => ({ ...i, type: "inappropriate" })),
  ];

  const totalScore = Math.min(100,
    patternResult.score + paymentResult.score + inappropriateResult.score
  );

  let status = "ok";
  if (totalScore >= 70) status = "blocked";
  else if (totalScore >= 30) status = "warning";

  if (totalScore > 0) {
    console.warn(`[SUNTREX Moderation] Score: ${totalScore}/100 | Status: ${status} | Issues:`, allIssues);
  }

  return {
    score: totalScore,
    status,
    issues: allIssues,
    message: status === "blocked" ? null : message,
  };
}

/**
 * Get a user-facing moderation message
 */
export function getModerationMessage(result, lang = "fr") {
  if (result.status === "ok") return null;

  const messages = {
    fr: {
      warning: "Attention : votre message contient des informations sensibles. Pour votre securite, utilisez les outils SUNTREX pour les transactions.",
      blocked: "Ce message a ete bloque par notre systeme de moderation. Merci de respecter la charte SUNTREX.",
    },
    en: {
      warning: "Warning: your message contains sensitive information. For your safety, use SUNTREX tools for transactions.",
      blocked: "This message was blocked by our moderation system. Please follow the SUNTREX guidelines.",
    },
  };

  return (messages[lang] || messages.fr)[result.status] || null;
}

export default { moderateMessage, getModerationMessage };
