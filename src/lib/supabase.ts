import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const NOT_CONFIGURED_ERROR = {
  message: 'Supabase bağlantısı yapılandırılmamış. .env dosyasını kontrol edin.',
};

type MockResult = {
  data: unknown[] | unknown | null;
  error: { message: string } | null;
  count: number | null;
};

function makeTerminalResult(): MockResult {
  return { data: [], error: NOT_CONFIGURED_ERROR, count: null };
}

function makeChainable(builder?: Partial<QueryBuilderState>): QueryBuilder {
  return new QueryBuilder(builder);
}

type QueryBuilderState = {
  table: string;
  columns: string;
  filters: { column: string; value: unknown }[];
  orders: { column: string; ascending: boolean }[];
  limitCount: number | null;
  isSingle: boolean;
  isMaybeSingle: boolean;
  isHead: boolean;
  isCountExact: boolean;
  insertRows: unknown[] | null;
  updateData: Record<string, unknown> | null;
  isDelete: boolean;
};

class QueryBuilder {
  private state: QueryBuilderState;

  constructor(partial?: Partial<QueryBuilderState>) {
    this.state = {
      table: partial?.table ?? '',
      columns: partial?.columns ?? '*',
      filters: partial?.filters ?? [],
      orders: partial?.orders ?? [],
      limitCount: partial?.limitCount ?? null,
      isSingle: partial?.isSingle ?? false,
      isMaybeSingle: partial?.isMaybeSingle ?? false,
      isHead: partial?.isHead ?? false,
      isCountExact: partial?.isCountExact ?? false,
      insertRows: partial?.insertRows ?? null,
      updateData: partial?.updateData ?? null,
      isDelete: partial?.isDelete ?? false,
    };
  }

  private clone(overrides: Partial<QueryBuilderState>): QueryBuilder {
    return new QueryBuilder({ ...this.state, ...overrides });
  }

  select(columns?: string): QueryBuilder {
    return this.clone({ columns: columns ?? '*' });
  }

  insert(rows: unknown[]): QueryBuilder {
    return this.clone({ insertRows: rows });
  }

  update(data: Record<string, unknown>): QueryBuilder {
    return this.clone({ updateData: data });
  }

  delete(): QueryBuilder {
    return this.clone({ isDelete: true });
  }

  eq(column: string, value: unknown): QueryBuilder {
    return this.clone({ filters: [...this.state.filters, { column, value }] });
  }

  gte(column: string, value: unknown): QueryBuilder {
    return this.clone({ filters: [...this.state.filters, { column, value }] });
  }

  in(column: string, value: unknown): QueryBuilder {
    return this.clone({ filters: [...this.state.filters, { column, value }] });
  }

  order(column: string, opts?: { ascending?: boolean }): QueryBuilder {
    return this.clone({
      orders: [...this.state.orders, { column, ascending: opts?.ascending ?? true }],
    });
  }

  limit(n: number): QueryBuilder {
    return this.clone({ limitCount: n });
  }

  single(): Promise<MockResult> {
    return this.clone({ isSingle: true }).execute();
  }

  maybeSingle(): Promise<MockResult> {
    return this.clone({ isMaybeSingle: true }).execute();
  }

  count(countOption: 'exact' | 'planned' | 'estimated', opts?: { head?: boolean }): Promise<MockResult> {
    return this.clone({ isCountExact: countOption === 'exact', isHead: opts?.head ?? false }).execute();
  }

  then(onFulfilled: (r: MockResult) => unknown, onRejected?: (e: unknown) => unknown): Promise<unknown> {
    return this.execute().then(onFulfilled, onRejected);
  }

  catch(onRejected: (e: unknown) => unknown): Promise<unknown> {
    return this.execute().catch(onRejected);
  }

  finally(onFinally: () => void): Promise<MockResult> {
    return this.execute().finally(onFinally);
  }

  private execute(): Promise<MockResult> {
    return Promise.resolve(makeTerminalResult());
  }
}

const mockSupabase = {
  from(table: string) {
    return makeChainable({ table });
  },
};

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : (mockSupabase as unknown as SupabaseClient);

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
  duty_group_id: string | null;
  phone: string | null;
  email: string | null;
  max_duties_per_month: number;
  active: boolean;
};

export type StaffWithGroup = Staff & {
  duty_groups: DutyGroup | null;
};

export type ShiftType = 'gunduz' | 'gece' | '24saat';

export type Duty = {
  id: string;
  staff_id: string | null;
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
  duty_groups: DutyGroup | null;
};

export type SwapStatus = 'pending' | 'approved' | 'rejected';

export type SwapRequest = {
  id: string;
  duty_id: string;
  from_staff_id: string;
  to_staff_id: string;
  status: SwapStatus;
  reason: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type SwapRequestWithRelations = SwapRequest & {
  duty: DutyWithRelations | null;
  from_staff: Staff | null;
  to_staff: Staff | null;
};

export type TaskList = {
  id: string;
  duty_group_id: string;
  name: string;
  description: string | null;
  color: string;
  cycle_days: number;
  current_turn_index: number;
  next_cycle_date: string;
  sort_order: number;
  created_at: string;
};

export type TaskTurn = {
  id: string;
  task_list_id: string;
  label: string;
  member_ids: string[];
  position: number;
  last_completed_at: string | null;
  completed: boolean;
  created_at: string;
};

export type TaskExtra = {
  id: string;
  task_list_id: string;
  label: string | null;
  performed_by_staff_id: string | null;
  note: string | null;
  performed_at: string;
};
