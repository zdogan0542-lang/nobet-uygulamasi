import type { DutyWithRelations, Staff } from '@/lib/supabase';

export type ConflictReason = 'consecutive' | 'monthly_limit' | 'duplicate_same_day';

export type Conflict = {
  reason: ConflictReason;
  message: string;
  severity: 'warning' | 'error';
};

export type RuleValidation = {
  conflicts: Conflict[];
  hasError: boolean;
  hasWarning: boolean;
};

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return dateToStr(d);
}

export function getConflictsForDuty(
  duty: {
    staff_id: string | null;
    duty_date: string;
    id?: string;
  shift_type?: string;
  department_id?: string | null;
  start_time?: string;
    end_time?: string;
  status?: string;
  notes?: string | null;
  },
  allDuties: DutyWithRelations[],
  staff: Staff[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  if (!duty.staff_id) return conflicts;

  const staffMember = staff.find((s) => s.id === duty.staff_id);
  const excludeId = duty.id;

  // 1. Consecutive day rule (24h rest)
  const prevDate = addDays(duty.duty_date, -1);
  const nextDate = addDays(duty.duty_date, 1);
  const prevDuties = allDuties.filter(
    (d) => d.staff_id === duty.staff_id && d.id !== excludeId && d.duty_date === prevDate
  );
  const nextDuties = allDuties.filter(
    (d) => d.staff_id === duty.staff_id && d.id !== excludeId && d.duty_date === nextDate
  );
  if (prevDuties.length > 0 || nextDuties.length > 0) {
    const days: string[] = [];
    if (prevDuties.length > 0) days.push('önceki gün');
    if (nextDuties.length > 0) days.push('sonraki gün');
    conflicts.push({
      reason: 'consecutive',
      message: `Bu personelin ${days.join(' ve ')} nöbeti var. 24 saat dinlenme kuralı ihlal ediliyor.`,
      severity: 'warning',
    });
  }

  // 2. Monthly limit
  if (staffMember) {
    const month = duty.duty_date.slice(0, 7);
    const monthCount = allDuties.filter(
      (d) => d.staff_id === duty.staff_id && d.id !== excludeId && d.duty_date.slice(0, 7) === month
    ).length;
    const max = staffMember.max_duties_per_month;
    if (monthCount >= max) {
      const [yr, mo] = month.split('-');
      const monthName = TR_MONTHS[parseInt(mo) - 1];
      conflicts.push({
        reason: 'monthly_limit',
        message: `Bu personelin ${monthName} ${yr} ayı için maksimum nöbet limiti (${max}) dolmuştur. (${monthCount}/${max})`,
        severity: 'error',
      });
    }
  }

  // 3. Duplicate same day (same shift type)
  const sameDaySameShift = allDuties.filter(
    (d) =>
      d.staff_id === duty.staff_id &&
      d.id !== excludeId &&
      d.duty_date === duty.duty_date &&
      d.shift_type === duty.shift_type
  );
  if (sameDaySameShift.length > 0) {
    conflicts.push({
      reason: 'duplicate_same_day',
      message: 'Bu personel aynı gün ve aynı nöbet türünde zaten atanmış.',
      severity: 'error',
    });
  }

  return conflicts;
}

export function validateDuty(
  duty: {
    staff_id: string | null;
    duty_date: string;
    id?: string;
    shift_type?: string;
    department_id?: string | null;
    start_time?: string;
    end_time?: string;
    status?: string;
    notes?: string | null;
  },
  allDuties: DutyWithRelations[],
  staff: Staff[]
): RuleValidation {
  const conflicts = getConflictsForDuty(duty, allDuties, staff);
  return {
    conflicts,
    hasError: conflicts.some((c) => c.severity === 'error'),
    hasWarning: conflicts.some((c) => c.severity === 'warning'),
  };
}

// Build a map of duty_id -> conflicts for all duties
export function buildConflictMap(
  duties: DutyWithRelations[],
  staff: Staff[]
): Map<string, Conflict[]> {
  const map = new Map<string, Conflict[]>();
  for (const duty of duties) {
    const conflicts = getConflictsForDuty(duty, duties, staff);
    if (conflicts.length > 0) {
      map.set(duty.id, conflicts);
    }
  }
  return map;
}

// Auto-schedule generator
export type AutoGenerateOptions = {
  year: number;
  month: number; // 0-indexed
  departmentId: string | null;
  shiftTypes: ShiftTypeOption[];
};

export type ShiftTypeOption = {
  type: 'gunduz' | 'gece' | '24saat';
  enabled: boolean;
};

export type GeneratedDuty = {
  staff_id: string;
  department_id: string;
  duty_date: string;
  start_time: string;
  end_time: string;
  status: 'upcoming';
  shift_type: 'gunduz' | 'gece' | '24saat';
  notes: null;
};

const SHIFT_TIMES: Record<string, { start: string; end: string }> = {
  gunduz: { start: '08:00', end: '20:00' },
  gece: { start: '20:00', end: '08:00' },
  '24saat': { start: '08:00', end: '08:00' },
};

export type AutoGenerateResult = {
  duties: GeneratedDuty[];
  unassigned: { date: string; shift_type: string; reason: string }[];
  stats: {
    total: number;
    assigned: number;
    skipped: number;
  };
};

export function generateAutoSchedule(
  options: AutoGenerateOptions,
  staff: Staff[],
  existingDuties: DutyWithRelations[]
): AutoGenerateResult {
  const { year, month, departmentId, shiftTypes } = options;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Get active staff for this department
  let eligibleStaff = staff.filter((s) => s.active);
  if (departmentId) {
    eligibleStaff = eligibleStaff.filter(
      (s) => s.department_id === departmentId || s.department_id === null
    );
  }

  const enabledShifts = shiftTypes.filter((s) => s.enabled).map((s) => s.type);

  // Track assignments: staffId -> Set of date strings
  const staffDutyDates = new Map<string, Set<string>>();
  // Track monthly counts: staffId -> count
  const staffMonthlyCount = new Map<string, number>();

  // Pre-populate from existing duties
  for (const d of existingDuties) {
    if (d.duty_date.slice(0, 7) === monthStr && d.staff_id) {
      staffDutyDates.set(d.staff_id, (staffDutyDates.get(d.staff_id) ?? new Set()).add(d.duty_date));
      staffMonthlyCount.set(d.staff_id, (staffMonthlyCount.get(d.staff_id) ?? 0) + 1);
    }
  }

  const generated: GeneratedDuty[] = [];
  const unassigned: { date: string; shift_type: string; reason: string }[] = [];

  // Round-robin index per shift type
  const shiftIdx: Record<string, number> = {};
  for (const st of enabledShifts) shiftIdx[st] = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;

    for (const shiftType of enabledShifts) {
      // Check if there's already a duty for this date+shift+department
      const existing = existingDuties.find(
        (d) =>
          d.duty_date === dateStr &&
          d.shift_type === shiftType &&
          (!departmentId || d.department_id === departmentId)
      );
      if (existing) continue;

      // Try to find an eligible staff member
      let assigned = false;
      const attempts = eligibleStaff.length;

      for (let attempt = 0; attempt < attempts; attempt++) {
        const idx = shiftIdx[shiftType] % eligibleStaff.length;
        shiftIdx[shiftType]++;
        const candidate = eligibleStaff[idx];

        // Check monthly limit
        const currentCount = staffMonthlyCount.get(candidate.id) ?? 0;
        if (currentCount >= candidate.max_duties_per_month) continue;

        // Check consecutive day rule
        const prevDate = addDays(dateStr, -1);
        const nextDate = addDays(dateStr, 1);
        const dutyDates = staffDutyDates.get(candidate.id) ?? new Set<string>();
        if (dutyDates.has(prevDate) || dutyDates.has(nextDate)) continue;

        // Check same-day duplicate
        if (dutyDates.has(dateStr)) continue;

        // Assign
        const times = SHIFT_TIMES[shiftType];
        generated.push({
          staff_id: candidate.id,
          department_id: departmentId ?? candidate.department_id ?? '',
          duty_date: dateStr,
          start_time: times.start,
          end_time: times.end,
          status: 'upcoming' as const,
          shift_type: shiftType as GeneratedDuty['shift_type'],
          notes: null,
        });

        staffDutyDates.set(candidate.id, dutyDates.add(dateStr));
        staffMonthlyCount.set(candidate.id, currentCount + 1);
        assigned = true;
        break;
      }

      if (!assigned) {
        unassigned.push({
          date: dateStr,
          shift_type: shiftType,
          reason: eligibleStaff.length === 0
            ? 'Uygun personel bulunamadı'
            : 'Tüm personel dolu veya kural ihlali',
        });
      }
    }
  }

  return {
    duties: generated,
    unassigned,
    stats: {
      total: daysInMonth * enabledShifts.length,
      assigned: generated.length,
      skipped: unassigned.length,
    },
  };
}

// CSV export
export function exportScheduleCSV(
  duties: DutyWithRelations[],
  monthName: string,
  year: number
): void {
  const headers = ['Tarih', 'Gün', 'Nöbet Türü', 'Personel', 'Ünvan', 'Bölüm', 'Başlangıç', 'Bitiş', 'Durum'];

  const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const STATUS_LABELS: Record<string, string> = {
    active: 'Aktif',
    upcoming: 'Bekleyen',
    completed: 'Tamamlandı',
    missed: 'Boş',
  };
  const SHIFT_LABELS: Record<string, string> = {
    gunduz: 'Gündüz',
    gece: 'Gece',
    '24saat': '24 Saat',
  };

  const rows = duties.map((d) => {
    const date = new Date(d.duty_date);
    const dayName = TR_DAYS[date.getDay()];
    const staffName = d.staff?.full_name ?? 'Atanmamış';
    const staffTitle = d.staff?.title ?? '';
    const deptName = d.departments?.name ?? '';
    const status = STATUS_LABELS[d.status] ?? d.status;
    const shiftLabel = SHIFT_LABELS[d.shift_type] ?? d.shift_type;
    return [d.duty_date, dayName, shiftLabel, staffName, staffTitle, deptName, d.start_time, d.end_time, status];
  });

  const csvContent = [
    `Nöbet Çizelgesi - ${monthName} ${year}`,
    '',
    headers.join(','),
    ...rows.map((r) => r.map((c) => `"${c}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nobet-cizelgesi-${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Print / PDF export
export function printSchedule(): void {
  window.print();
}
