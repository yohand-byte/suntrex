/**
 * SUNTREX — useAuth Hook
 * 
 * Real Supabase Auth integration:
 * - Session persistence + auto-refresh
 * - Profile + Company auto-creation on signup
 * - RGPD consent recording
 * - VAT verification via Netlify Function
 * - Logout with state cleanup
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ─── Auth State Shape ──────────────────────────────────────────
const INITIAL_STATE = {
  user: null,          // Full user object (profile + company)
  session: null,       // Supabase session
  loading: true,       // Initial session check
  error: null,
};

export function useAuth() {
  const [state, setState] = useState(INITIAL_STATE);

  // ─── Fetch full user profile + company ────────────────────────
  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_with_company')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[useAuth] fetchUserProfile error:', err.message);
      return null;
    }
  }, []);

  // ─── Initialize: check existing session ───────────────────────
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user && mounted) {
          const profile = await fetchUserProfile(session.user.id);
          setState({
            user: profile,
            session,
            loading: false,
            error: null,
          });
        } else if (mounted) {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        if (mounted) {
          setState(prev => ({ ...prev, loading: false, error: err.message }));
        }
      }
    };

    initSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setState({
            user: profile,
            session,
            loading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          setState({ ...INITIAL_STATE, loading: false });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState(prev => ({ ...prev, session }));
        } else if (event === 'USER_UPDATED' && session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setState(prev => ({
            ...prev,
            user: profile,
            session,
          }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  // ─── REGISTER ─────────────────────────────────────────────────
  const register = useCallback(async ({
    email,
    password,
    firstName,
    lastName,
    phone,
    role,
    companyName,
    country,
    vatNumber,
    vatVerified,
    vatCompanyName,
    vatAddress,
    consents, // { cgv: true, marketingSuntrex: bool, marketingPartners: bool }
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // 1. Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
          },
          // Email confirmation redirect
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error('Inscription échouée — aucun utilisateur créé');

      // 2. Update profile with additional fields (trigger created basic profile)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: phone || null,
          preferred_language: navigator.language?.startsWith('fr') ? 'fr' : 'en',
        })
        .eq('id', userId);

      if (profileError) {
        console.warn('[useAuth] Profile update warning:', profileError.message);
        // Non-blocking: profile was created by trigger, extra fields are optional
      }

      // 3. Create company
      const { error: companyError } = await supabase
        .from('companies')
        .insert({
          owner_id: userId,
          name: companyName,
          country,
          vat_number: vatNumber || null,
          vat_verified: vatVerified || false,
          vat_company_name: vatCompanyName || null,
          vat_address: vatAddress || null,
        });

      if (companyError) {
        console.error('[useAuth] Company creation error:', companyError.message);
        // Don't throw — user is created, company can be added later
      }

      // 4. Record RGPD consents (append-only audit trail)
      const consentRecords = [
        { user_id: userId, consent_type: 'cgv_privacy', granted: true },
        { user_id: userId, consent_type: 'marketing_suntrex', granted: !!consents.marketingSuntrex },
        { user_id: userId, consent_type: 'marketing_partners', granted: !!consents.marketingPartners },
      ];

      const { error: consentError } = await supabase
        .from('consents')
        .insert(consentRecords);

      if (consentError) {
        console.warn('[useAuth] Consent recording warning:', consentError.message);
        // Non-blocking: consent was given, just logging failed
      }

      // 5. Fetch complete profile
      const profile = await fetchUserProfile(userId);

      setState({
        user: profile,
        session: authData.session,
        loading: false,
        error: null,
      });

      return { success: true, user: profile, needsEmailConfirmation: !authData.session };

    } catch (err) {
      const errorMsg = translateSupabaseError(err.message);
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  }, [fetchUserProfile]);

  // ─── LOGIN ────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Update last_login_at
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      const profile = await fetchUserProfile(data.user.id);

      setState({
        user: profile,
        session: data.session,
        loading: false,
        error: null,
      });

      return { success: true, user: profile };

    } catch (err) {
      const errorMsg = translateSupabaseError(err.message);
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  }, [fetchUserProfile]);

  // ─── FORGOT PASSWORD ─────────────────────────────────────────
  const resetPassword = useCallback(async (email) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setState(prev => ({ ...prev, loading: false }));
      return { success: true };

    } catch (err) {
      const errorMsg = translateSupabaseError(err.message);
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  }, []);

  // ─── LOGOUT ───────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ ...INITIAL_STATE, loading: false });
  }, []);

  // ─── REFRESH PROFILE ─────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    if (!state.session?.user?.id) return;
    const profile = await fetchUserProfile(state.session.user.id);
    if (profile) {
      setState(prev => ({ ...prev, user: profile }));
    }
  }, [state.session, fetchUserProfile]);

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    isLoggedIn: !!state.user,
    isVerified: state.user?.is_verified || false,
    register,
    login,
    logout,
    resetPassword,
    refreshProfile,
  };
}

// ─── VAT VERIFICATION (calls Netlify Function) ─────────────────

export async function verifyVAT(vatNumber, countryCode) {
  try {
    const response = await fetch('/.netlify/functions/verify-vat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vatNumber, countryCode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erreur de vérification TVA');
    }

    return await response.json();
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

// ─── Error Translation (Supabase → French) ─────────────────────

function translateSupabaseError(message) {
  const map = {
    'Invalid login credentials': 'Email ou mot de passe incorrect',
    'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter',
    'User already registered': 'Un compte existe déjà avec cet email',
    'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 8 caractères',
    'Unable to validate email address: invalid format': 'Format d\'email invalide',
    'Email rate limit exceeded': 'Trop de tentatives. Réessayez dans quelques minutes',
    'For security purposes, you can only request this after': 'Veuillez patienter avant de réessayer',
    'Signup requires a valid password': 'Mot de passe requis',
  };

  for (const [eng, fra] of Object.entries(map)) {
    if (message.includes(eng)) return fra;
  }

  return message;
}

export default useAuth;
