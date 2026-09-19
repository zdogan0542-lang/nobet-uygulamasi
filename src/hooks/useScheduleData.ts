import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DutyGroup, DutyWithRelations, ShiftType, Staff } from '@/lib/supabase';

export type DutyInput = {
  staff_id: string | null;
  duty_group_id: string | null;
  duty_date: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'upcoming' | 'completed' | 'missed';
  shift_type: ShiftType;
  notes: string | null;
};

export type ScheduleData = {
  staff: Staff[];
  dutyGroups: DutyGroup[];
  duties: DutyWithRelations[];
  loading: boolean;
  error: string | null;
  createDuty: (input: DutyInput) => Promise<{ error: string | null }>;
  updateDuty: (id: string, input: DutyInput) => Promise<{ error: string | null }>;
  deleteDuty: (id: string) => Promise<{ error: string | null }>;
  bulkCreateDuties: (inputs: DutyInput[]) => Promise<{ error: string | null; count: number }>;
  refetch: () => Promise<void>;
};

export function useScheduleData(): ScheduleData {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [dutyGroups, setDutyGroups] = useState<DutyGroup[]>([]);
  const [duties, setDuties] = useState<DutyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: groupData, error: groupError },
             { data: staffData, error: staffError },
             { data: dutyData, error: dutyError }] = await Promise.all([
        supabase.from('duty_groups').select('*').order('name'),
        supabase.from('staff').select('*').order('full_name'),
        supabase
          .from('duties')
          .select('*, staff(*), duty_groups(*)')
          .order('duty_date', { ascending: true })
          .order('start_time', { ascending: true }),
      ]);

      if (groupError) throw groupError;
      if (staffError) throw staffError;
      if (dutyError) throw dutyError;

      setDutyGroups(groupData ?? []);
      setStaff(staffData ?? []);
      setDuties((dutyData ?? []) as DutyWithRelations[]);
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

  const createDuty = useCallback(async (input: DutyInput): Promise<{ error: string | null }> => {
    const { error: insertError } = await supabase.from('duties').insert([input]);
    if (insertError) return { error: insertError.message };
    await fetchAll();
    return { error: null };
  }, [fetchAll]);

  const updateDuty = useCallback(async (id: string, input: DutyInput): Promise<{ error: string | null }> => {
    const { error: updateError } = await supabase.from('duties').update(input).eq('id', id);
    if (updateError) return { error: updateError.message };
    await fetchAll();
    return { error: null };
  }, [fetchAll]);

  const deleteDuty = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const { error: deleteError } = await supabase.from('duties').delete().eq('id', id);
    if (deleteError) return { error: deleteError.message };
    await fetchAll();
    return { error: null };
  }, [fetchAll]);

  const bulkCreateDuties = useCallback(async (inputs: DutyInput[]): Promise<{ error: string | null; count: number }> => {
    if (inputs.length === 0) return { error: null, count: 0 };
    const { error: insertError } = await supabase.from('duties').insert(inputs);
    if (insertError) return { error: insertError.message, count: 0 };
    await fetchAll();
    return { error: null, count: inputs.length };
  }, [fetchAll]);

  return {
    staff,
    dutyGroups,
    duties,
    loading,
    error,
    createDuty,
    updateDuty,
    deleteDuty,
    bulkCreateDuties,
    refetch: fetchAll,
  };
}
