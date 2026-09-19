import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Department = {
  id: string;
  name: string;
  color: string;
};

export type DutyGroup = {
  id: string;
  name: string;
  color: string;
  max_duties_per_month: number;
  min_rest_hours: number;
};

export type Staff = {
  id: string;
  full_name: string;
  title: string;
  department_id: string | null;
  duty_group_id: string | null;
  phone: string | null;
  email: string | null;
  max_duties_per_month: number;
  active: boolean;
};

export type StaffWithDepartment = Staff & {
  departments: Department | null;
  duty_groups: DutyGroup | null;
};

export type ShiftType = 'gunduz' | 'gece' | '24saat';

export type Duty = {
  id: string;
  staff_id: string | null;
  department_id: string | null;
  duty_group_id: string | null;
  duty_date: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'upcoming' | 'completed' | 'missed';
  shift_type: ShiftType;
  notes: string | null;
};

export type DutyWithRelations = Duty & {
  staff: Staff | null;
  departments: Department | null;
  duty_groups: DutyGroup | null;
};
