import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Department, DutyWithRelations, Staff } from '@/lib/supabase';

export type DashboardData = {
  staff: Staff[];
  departments: Department[];
  duties: DutyWithRelations[];
  loading: boolean;
  error: string | null;
};

export function useDashboardData(): DashboardData {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [duties, setDuties] = useState<DutyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        const [{ data: deptData, error: deptError },
               { data: staffData, error: staffError },
               { data: dutyData, error: dutyError }] = await Promise.all([
          supabase.from('departments').select('*').order('name'),
          supabase.from('staff').select('*').order('full_name'),
          supabase
            .from('duties')
            .select('*, staff(*), department(*)')
            .order('duty_date', { ascending: true })
            .order('start_time', { ascending: true }),
        ]);

        if (deptError) throw deptError;
        if (staffError) throw staffError;
        if (dutyError) throw dutyError;

        setDepartments(deptData ?? []);
        setStaff(staffData ?? []);
        setDuties((dutyData ?? []) as DutyWithRelations[]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Veriler yüklenirken bir hata oluştu';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  return { staff, departments, duties, loading, error };
}
