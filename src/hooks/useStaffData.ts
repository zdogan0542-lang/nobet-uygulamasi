import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { DutyGroup, StaffWithGroup } from '@/lib/supabase';

export type StaffInput = {
  full_name: string;
  title: string;
  duty_group_id: string | null;
  phone: string | null;
  email: string | null;
  max_duties_per_month: number;
  active: boolean;
};

export function useStaffData() {
  const [staff, setStaff] = useState<StaffWithGroup[]>([]);
  const [dutyGroups, setDutyGroups] = useState<DutyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: groupData, error: groupError },
             { data: staffData, error: staffError }] = await Promise.all([
        supabase.from('duty_groups').select('*').order('name'),
        supabase
          .from('staff')
          .select('*, duty_groups(*)')
          .order('full_name', { ascending: true }),
      ]);

      if (groupError) throw groupError;
      if (staffError) throw staffError;

      setDutyGroups(groupData ?? []);
      setStaff((staffData ?? []) as StaffWithGroup[]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError(String((err as { message: unknown }).message));
      } else {
        setError('Veriler yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createStaff = useCallback(async (input: StaffInput): Promise<{ error: string | null }> => {
    const { error: insertError } = await supabase.from('staff').insert([input]);
    if (insertError) return { error: insertError.message };
    await fetchAll();
    return { error: null };
  }, [fetchAll]);

  const updateStaff = useCallback(async (id: string, input: StaffInput): Promise<{ error: string | null }> => {
    const { error: updateError } = await supabase.from('staff').update(input).eq('id', id);
    if (updateError) return { error: updateError.message };
    await fetchAll();
    return { error: null };
  }, [fetchAll]);

  const deleteStaff = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const { error: deleteError } = await supabase.from('staff').delete().eq('id', id);
    if (deleteError) return { error: deleteError.message };
    await fetchAll();
    return { error: null };
  }, [fetchAll]);

  const getUpcomingDutyCount = useCallback(async (staffId: string): Promise<number> => {
    const today = new Date().toISOString().slice(0, 10);
    const { count, error: countError } = await supabase
      .from('duties')
      .select('*', { count: 'exact', head: true })
      .eq('staff_id', staffId)
      .gte('duty_date', today)
      .in('status', ['upcoming', 'active']);
    if (countError) return 0;
    return count ?? 0;
  }, []);

  return {
    staff,
    dutyGroups,
    loading,
    error,
    createStaff,
    updateStaff,
    deleteStaff,
    getUpcomingDutyCount,
    refetch: fetchAll,
  };
}
