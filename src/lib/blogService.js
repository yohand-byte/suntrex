// ═══════════════════════════════════════════════════════════════
// SUNTREX BLOG SERVICE — Supabase Integration
// ═══════════════════════════════════════════════════════════════

import { supabase } from "./supabase";

// ─── Articles ────────────────────────────────────────────────

/**
 * Fetch published articles with optional filters
 */
export async function fetchArticles({ category, search, limit = 20, offset = 0 } = {}) {
  if (!supabase) return { data: [], count: 0 };

  let query = supabase
    .from("blog_articles")
    .select("*", { count: "exact" })
    .eq("published", true)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.textSearch("fts", search, { config: "french" });
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("fetchArticles error:", error);
    return { data: [], count: 0 };
  }
  return { data: data || [], count };
}

/**
 * Fetch a single article by slug (with reactions + comments via RPC)
 */
export async function fetchArticleBySlug(slug) {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("get_blog_article", { p_slug: slug });

  if (error) {
    console.error("fetchArticleBySlug error:", error);
    return null;
  }
  return data;
}

/**
 * Fetch featured articles
 */
export async function fetchFeaturedArticles(limit = 3) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("published", true)
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchFeaturedArticles error:", error);
    return [];
  }
  return data || [];
}

// ─── Reactions ───────────────────────────────────────────────

/**
 * Add a reaction to an article
 */
export async function addReaction(articleId, reactionType, userId, sessionId) {
  if (!supabase) return null;

  const row = {
    article_id: articleId,
    reaction_type: reactionType,
    ...(userId ? { user_id: userId } : { session_id: sessionId }),
  };

  const { data, error } = await supabase
    .from("blog_reactions")
    .upsert(row, { onConflict: userId ? "article_id,user_id,reaction_type" : "article_id,session_id,reaction_type" })
    .select()
    .single();

  if (error) {
    console.error("addReaction error:", error);
    return null;
  }
  return data;
}

/**
 * Remove a reaction
 */
export async function removeReaction(articleId, reactionType, userId, sessionId) {
  if (!supabase) return false;

  let query = supabase
    .from("blog_reactions")
    .delete()
    .eq("article_id", articleId)
    .eq("reaction_type", reactionType);

  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.eq("session_id", sessionId);
  }

  const { error } = await query;
  if (error) {
    console.error("removeReaction error:", error);
    return false;
  }
  return true;
}

// ─── Comments ────────────────────────────────────────────────

/**
 * Fetch approved comments for an article
 */
export async function fetchComments(articleId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_comments")
    .select("*")
    .eq("article_id", articleId)
    .eq("approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchComments error:", error);
    return [];
  }
  return data || [];
}

/**
 * Submit a comment (requires authentication)
 */
export async function submitComment(articleId, content, userName, userEmail) {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("blog_comments")
    .insert({
      article_id: articleId,
      user_id: user?.id || null,
      user_name: userName,
      user_email: userEmail,
      content,
      approved: false, // requires moderation
    })
    .select()
    .single();

  if (error) {
    console.error("submitComment error:", error);
    return null;
  }
  return data;
}

// ─── Newsletter ──────────────────────────────────────────────

/**
 * Subscribe to the blog newsletter
 */
export async function subscribeNewsletter(email, name, consentMarketing = false, consentPartners = false) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("blog_subscribers")
    .upsert({
      email,
      name,
      subscribed: true,
      source: "blog_sidebar",
      consent_marketing: consentMarketing,
      consent_partners: consentPartners,
    }, { onConflict: "email" })
    .select()
    .single();

  if (error) {
    console.error("subscribeNewsletter error:", error);
    return null;
  }
  return data;
}

// ─── AI Generation ───────────────────────────────────────────

/**
 * Generate an article via AI (admin only)
 */
export async function generateArticle(topic, category) {
  const response = await fetch("/api/blog-ai-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, category }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "AI generation failed");
  }

  return response.json();
}

// ─── Search ──────────────────────────────────────────────────

/**
 * Full-text search articles
 */
export async function searchArticles(query, limit = 10) {
  if (!supabase || !query) return [];

  const { data, error } = await supabase.rpc("search_blog_articles", {
    search_query: query,
    limit_count: limit,
  });

  if (error) {
    console.error("searchArticles error:", error);
    return [];
  }
  return data || [];
}
