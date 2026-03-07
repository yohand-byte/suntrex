import { useState, useMemo, useCallback } from "react";

/**
 * SUNTREX — Smart Search Hook
 *
 * Features:
 * - Fuzzy matching (Levenshtein distance)
 * - PV-specific synonyms (FR/EN/DE)
 * - Multi-field search (name, brand, SKU, category, description, type)
 * - Scoring: exact > partial > fuzzy > synonym
 * - Real-time suggestions
 */

// PV synonym groups — each group maps equivalent terms
var SYNONYMS = [
  ["onduleur", "inverter", "wechselrichter", "inverseur", "convertisseur"],
  ["panneau", "panel", "module", "modul", "panneau solaire", "solar panel", "solarmodul"],
  ["batterie", "battery", "batteria", "stockage", "storage", "speicher", "accumulateur", "accumulator"],
  ["micro-onduleur", "microinverter", "micro inverter", "mikrowechselrichter", "micro-inverseur"],
  ["optimiseur", "optimizer", "optimiser", "leistungsoptimierer", "power optimizer"],
  ["montage", "mounting", "structure", "fixation", "support", "befestigung", "racking"],
  ["cable", "cables", "kabel", "cablage", "wiring", "fil", "electrical", "electrotechnique", "coffret", "connecteur", "disjoncteur", "parafoudre"],
  ["chargeur", "charger", "ev charger", "borne", "wallbox", "ladestation", "borne de recharge"],
  ["triphasé", "triphase", "three phase", "3 phase", "3p", "dreiphasig"],
  ["monophasé", "monophase", "single phase", "1 phase", "1p", "einphasig"],
  ["hybride", "hybrid", "hybrid inverter", "onduleur hybride"],
  ["residentiel", "residential", "résidentiel", "home", "maison", "wohngebäude"],
  ["commercial", "commercial", "gewerbe", "industriel", "industrial"],
  ["string", "string inverter", "onduleur string"],
];

// Build a fast lookup map: word -> list of synonym words
var SYNONYM_MAP = {};
SYNONYMS.forEach(function (group) {
  group.forEach(function (word) {
    var key = word.toLowerCase().trim();
    SYNONYM_MAP[key] = group.map(function (w) { return w.toLowerCase().trim(); });
  });
});

/**
 * Simple Levenshtein distance (for strings up to ~30 chars)
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Limit computation for performance
  if (Math.abs(a.length - b.length) > 5) return 999;

  var matrix = [];
  for (var i = 0; i <= b.length; i++) matrix[i] = [i];
  for (var j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      var cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Expand a query term into its synonym group
 */
function expandSynonyms(term) {
  var key = term.toLowerCase().trim();
  if (SYNONYM_MAP[key]) return SYNONYM_MAP[key];

  // Check partial matches
  var matches = [];
  Object.keys(SYNONYM_MAP).forEach(function (k) {
    if (k.includes(key) || key.includes(k)) {
      matches = matches.concat(SYNONYM_MAP[k]);
    }
  });
  return matches.length > 0 ? Array.from(new Set(matches)) : [key];
}

/**
 * Score a product against a search query
 * Returns 0 if no match, higher = better match
 */
function scoreProduct(product, queryTerms, expandedTerms) {
  var fields = [
    { value: product.name || "", weight: 3 },
    { value: product.brand || "", weight: 2.5 },
    { value: product.sku || "", weight: 4 },
    { value: product.category || "", weight: 1.5 },
    { value: product.type || "", weight: 1.5 },
    { value: product.power || "", weight: 1 },
    { value: (product.description || "").slice(0, 200), weight: 0.5 },
  ];

  var totalScore = 0;

  queryTerms.forEach(function (term) {
    var bestFieldScore = 0;

    fields.forEach(function (field) {
      var haystack = field.value.toLowerCase();
      var score = 0;

      // Exact match
      if (haystack === term) {
        score = 100 * field.weight;
      }
      // Contains exact term
      else if (haystack.includes(term)) {
        // Bonus for match at start of word
        var startBonus = haystack.startsWith(term) || haystack.includes(" " + term) ? 1.5 : 1;
        score = 60 * field.weight * startBonus;
      }
      // Synonym match
      else {
        var synonyms = expandedTerms[term] || [];
        var hasSynonym = synonyms.some(function (syn) { return haystack.includes(syn); });
        if (hasSynonym) {
          score = 30 * field.weight;
        }
        // Fuzzy match (only for terms >= 4 chars to avoid noise)
        else if (term.length >= 4) {
          var words = haystack.split(/[\s\-_,]+/);
          var minDist = 999;
          words.forEach(function (w) {
            if (w.length >= 3) {
              var d = levenshtein(term, w);
              if (d < minDist) minDist = d;
            }
          });
          // Allow distance of 1 for 4-5 char terms, 2 for 6+ char terms
          var maxDist = term.length <= 5 ? 1 : 2;
          if (minDist <= maxDist) {
            score = (15 - minDist * 5) * field.weight;
          }
        }
      }

      if (score > bestFieldScore) bestFieldScore = score;
    });

    totalScore += bestFieldScore;
  });

  return totalScore;
}

/**
 * useSmartSearch hook
 *
 * @param {Array} products - Product catalog array
 * @param {Object} options - { maxResults: number }
 * @returns {{ query, setQuery, results, suggestions }}
 */
export default function useSmartSearch(products, options) {
  var maxResults = (options && options.maxResults) || 8;
  var [query, setQuery] = useState("");

  // Pre-expand synonyms for each query term
  var queryData = useMemo(function () {
    var q = query.trim().toLowerCase();
    if (q.length < 2) return { terms: [], expanded: {} };

    var terms = q.split(/\s+/).filter(function (t) { return t.length >= 2; });
    var expanded = {};
    terms.forEach(function (t) {
      expanded[t] = expandSynonyms(t);
    });
    return { terms: terms, expanded: expanded };
  }, [query]);

  // Score and rank all products
  var results = useMemo(function () {
    if (queryData.terms.length === 0) return [];

    return products
      .map(function (p) {
        return { product: p, score: scoreProduct(p, queryData.terms, queryData.expanded) };
      })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, maxResults)
      .map(function (r) { return r.product; });
  }, [products, queryData, maxResults]);

  // Suggestions (top 5 for autocomplete dropdown)
  var suggestions = useMemo(function () {
    return results.slice(0, 5);
  }, [results]);

  var search = useCallback(function (q) {
    setQuery(q);
  }, []);

  return {
    query: query,
    setQuery: search,
    results: results,
    suggestions: suggestions,
  };
}
