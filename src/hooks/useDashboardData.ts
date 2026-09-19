import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DutyGroup, DutyWithRelations, Staff } from '@/lib/supabase';

export type DashboardData = {
  staff: Staff[];
  dutyGroups: DutyGroup[];
  duties: DutyWithRelations[];
  loading: boolean;
  error: string | null;
};

export function useDashboardData(): DashboardData {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [dutyGroups, setDutyGroups] = useState<DutyGroup[]>([]);
  const [duties, setDuties] = useState<DutyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
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
    }

    fetchAll();
  }, []);

  return { staff, dutyGroups, duties, loading, error };
}
