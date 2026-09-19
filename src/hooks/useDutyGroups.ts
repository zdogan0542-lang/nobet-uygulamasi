import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DutyGroup } from '@/lib/supabase';

export type DutyGroupInput = {
  name: string;
  color: string;
  max_duties_per_month: number;
  min_rest_hours: number;
};

export function useDutyGroups() {
  const [dutyGroups, setDutyGroups] = useState<DutyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('duty_groups')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setDutyGroups(data ?? []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError(String((err as { message: unknown }).message));
      } else {
        setError('Nöbet grupları yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = useCallback(
    async (input: DutyGroupInput): Promise<{ error: string | null; data: DutyGroup | null }> => {
      const { data, error: insertError } = await supabase
        .from('duty_groups')
        .insert([input])
        .select()
        .maybeSingle();

      if (insertError) return { error: insertError.message, data: null };
      await fetchGroups();
      return { error: null, data: data as DutyGroup | null };
    },
    [fetchGroups]
  );

  const updateGroup = useCallback(
    async (id: string, input: DutyGroupInput): Promise<{ error: string | null }> => {
      const { error: updateError } = await supabase
        .from('duty_groups')
        .update(input)
        .eq('id', id);

      if (updateError) return { error: updateError.message };
      await fetchGroups();
      return { error: null };
    },
    [fetchGroups]
  );

  const deleteGroup = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      const { error: deleteError } = await supabase
        .from('duty_groups')
        .delete()
        .eq('id', id);

      if (deleteError) return { error: deleteError.message };
      await fetchGroups();
      return { error: null };
    },
    [fetchGroups]
  );

  return {
    dutyGroups,
    loading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    refetch: fetchGroups,
  };
}
