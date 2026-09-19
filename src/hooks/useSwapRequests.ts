import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DutyWithRelations, Staff, SwapRequestWithRelations, SwapStatus } from '@/lib/supabase';

export type SwapRequestInput = {
  duty_id: string;
  from_staff_id: string;
  to_staff_id: string;
  reason: string | null;
};

export function useSwapRequests() {
  const [swapRequests, setSwapRequests] = useState<SwapRequestWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('swap_requests')
        .select('*, duty(*, staff(*), duty_groups(*)), from_staff(*), to_staff(*)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSwapRequests((data ?? []) as SwapRequestWithRelations[]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError(String((err as { message: unknown }).message));
      } else {
        setError('Değişim talepleri yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createSwapRequest = useCallback(
    async (input: SwapRequestInput): Promise<{ error: string | null }> => {
      const { error: insertError } = await supabase.from('swap_requests').insert([input]);
      if (insertError) return { error: insertError.message };
      await fetchAll();
      return { error: null };
    },
    [fetchAll]
  );

  const updateSwapStatus = useCallback(
    async (
      id: string,
      status: SwapStatus
    ): Promise<{ error: string | null; duty: DutyWithRelations | null }> => {
      const now = new Date().toISOString();
      const { data: updated, error: updateError } = await supabase
        .from('swap_requests')
        .update({ status, resolved_at: now, updated_at: now })
        .eq('id', id)
        .select('*, duty(*, staff(*), duty_groups(*)), from_staff(*), to_staff(*)')
        .maybeSingle();

      if (updateError) return { error: updateError.message, duty: null };

      const swap = updated as SwapRequestWithRelations | null;
      if (status === 'approved' && swap) {
        const { error: dutyError } = await supabase
          .from('duties')
          .update({ staff_id: swap.to_staff_id })
          .eq('id', swap.duty_id);

        if (dutyError) return { error: dutyError.message, duty: null };
      }

      await fetchAll();
      return { error: null, duty: swap?.duty ?? null };
    },
    [fetchAll]
  );

  const deleteSwapRequest = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      const { error: deleteError } = await supabase.from('swap_requests').delete().eq('id', id);
      if (deleteError) return { error: deleteError.message };
      await fetchAll();
      return { error: null };
    },
    [fetchAll]
  );

  return {
    swapRequests,
    loading,
    error,
    createSwapRequest,
    updateSwapStatus,
    deleteSwapRequest,
    refetch: fetchAll,
  };
}

export type SwapStaffInfo = Pick<Staff, 'id' | 'full_name' | 'title' | 'active' | 'duty_group_id'>;
