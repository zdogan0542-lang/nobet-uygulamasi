import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DutyGroup, Staff, TaskList, TaskTurn } from '@/lib/supabase';

export type ActiveRotation = {
  taskList: TaskList;
  group: DutyGroup;
  currentTurn: TaskTurn;
  currentStaff: Staff | null;
  memberStaff: Staff[];
  turnCount: number;
  turnPosition: number; // 0-indexed
};

export type ActiveRotationData = {
  rotations: ActiveRotation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  advance: (taskListId: string) => Promise<{ error: string | null }>;
};

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function useActiveRotation(): ActiveRotationData {
  const [rotations, setRotations] = useState<ActiveRotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        { data: lists, error: listError },
        { data: turns, error: turnError },
        { data: groups, error: groupError },
        { data: staff, error: staffError },
      ] = await Promise.all([
        supabase.from('task_lists').select('*').order('sort_order', { ascending: true }),
        supabase.from('task_turns').select('*').order('position', { ascending: true }),
        supabase.from('duty_groups').select('*'),
        supabase.from('staff').select('*'),
      ]);

      if (listError) throw listError;
      if (turnError) throw turnError;
      if (groupError) throw groupError;
      if (staffError) throw staffError;

      const taskLists = (lists ?? []) as TaskList[];
      const allTurns = (turns ?? []) as TaskTurn[];
      const dutyGroups = (groups ?? []) as DutyGroup[];
      const allStaff = (staff ?? []) as Staff[];

      const result: ActiveRotation[] = [];
      for (const tl of taskLists) {
        const tlTurns = allTurns
          .filter((t) => t.task_list_id === tl.id)
          .sort((a, b) => a.position - b.position);
        if (tlTurns.length === 0) continue;
        const idx = Math.min(tl.current_turn_index, tlTurns.length - 1);
        const currentTurn = tlTurns[idx];
        if (!currentTurn) continue;
        const group = dutyGroups.find((g) => g.id === tl.duty_group_id);
        if (!group) continue;
        const memberStaff = currentTurn.member_ids
          .map((id) => allStaff.find((s) => s.id === id))
          .filter((s): s is Staff => Boolean(s));
        const currentStaff = memberStaff[0] ?? null;
        result.push({
          taskList: tl,
          group,
          currentTurn,
          currentStaff,
          memberStaff,
          turnCount: tlTurns.length,
          turnPosition: idx,
        });
      }

      setRotations(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError(String((err as { message: unknown }).message));
      } else {
        setError('Aktif nöbet sıraları yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const advance = useCallback(
    async (taskListId: string): Promise<{ error: string | null }> => {
      // Fetch the task list and its turns fresh
      const { data: tl, error: tlErr } = await supabase
        .from('task_lists')
        .select('*')
        .eq('id', taskListId)
        .maybeSingle();
      if (tlErr) return { error: tlErr.message };
      if (!tl) return { error: 'Görev listesi bulunamadı' };

      const { data: turns, error: turnErr } = await supabase
        .from('task_turns')
        .select('*')
        .eq('task_list_id', taskListId)
        .order('position', { ascending: true });
      if (turnErr) return { error: turnErr.message };
      const tlTurns = (turns ?? []) as TaskTurn[];
      if (tlTurns.length === 0) return { error: 'Nöbet sırası boş' };

      const taskList = tl as TaskList;
      const currentIndex = Math.min(taskList.current_turn_index, tlTurns.length - 1);
      const currentTurn = tlTurns[currentIndex];
      if (!currentTurn) return { error: 'Aktif nöbetçi bulunamadı' };

      const now = new Date().toISOString();
      const nextIndex = (currentIndex + 1) % tlTurns.length;
      const newCycleDate = addDays(
        new Date().toISOString().slice(0, 10),
        taskList.cycle_days
      );

      const { error: turnUpdateErr } = await supabase
        .from('task_turns')
        .update({ completed: true, last_completed_at: now })
        .eq('id', currentTurn.id);
      if (turnUpdateErr) return { error: turnUpdateErr.message };

      const { error: listUpdateErr } = await supabase
        .from('task_lists')
        .update({ current_turn_index: nextIndex, next_cycle_date: newCycleDate })
        .eq('id', taskListId);
      if (listUpdateErr) return { error: listUpdateErr.message };

      await fetchAll();
      return { error: null };
    },
    [fetchAll]
  );

  return { rotations, loading, error, refetch: fetchAll, advance };
}
