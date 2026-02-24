import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useTransaction(transactionId) {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!transactionId) return;

    async function fetchTransaction() {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('transactions')
          .select(`
            *,
            buyer:profiles!buyer_id (
              id, company_name, country_code, role, avatar_url, badges,
              vat_number, vat_verified, vat_verified_at, rating, rating_count,
              transactions_completed, active_offers, avg_response_time_minutes,
              created_at
            ),
            seller:profiles!seller_id (
              id, company_name, country_code, role, avatar_url, badges,
              vat_number, vat_verified, vat_verified_at, rating, rating_count,
              transactions_completed, active_offers, avg_response_time_minutes,
              created_at
            )
          `)
          .eq('id', transactionId)
          .single();

        if (fetchError) throw fetchError;
        setTransaction(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTransaction();
  }, [transactionId]);

  const updateStatus = useCallback(async (status) => {
    if (!transactionId) return;
    try {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status,
          [`${status}_at`]: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (updateError) throw updateError;
      setTransaction((prev) => prev ? { ...prev, status } : prev);
    } catch (err) {
      setError(err.message);
    }
  }, [transactionId]);

  return { transaction, loading, error, updateStatus };
}
