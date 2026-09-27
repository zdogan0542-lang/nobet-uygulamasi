import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Staff, TaskExtra, TaskList, TaskTurn } from '@/lib/supabase';

export type TaskListDetailData = {
  taskList: TaskList | null;
  turns: TaskTurn[];
  extras: TaskExtra[];
  staff: Staff[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function useTaskListDetail(taskListId: string | null): TaskListDetailData {
  const [taskList, setTaskList] = useState<TaskList | null>(null);
  const [turns, setTurns] = useState<TaskTurn[]>([]);
  const [extras, setExtras] = useState<TaskExtra[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!taskListId) {
      setTaskList(null);
      setTurns([]);
      setExtras([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [
        { data: listData, error: listError },
        { data: turnData, error: turnError },
        { data: extraData, error: extraError },
        { data: staffData, error: staffError },
      ] = await Promise.all([
        supabase.from('task_lists').select('*').eq('id', taskListId).maybeSingle(),
        supabase
          .from('task_turns')
          .select('*')
          .eq('task_list_id', taskListId)
          .order('position', { ascending: true }),
        supabase
          .from('task_extras')
          .select('*')
          .eq('task_list_id', taskListId)
          .order('performed_at', { ascending: false })
          .limit(20),
        supabase.from('staff').select('*').order('full_name', { ascending: true }),
      ]);

      if (listError) throw listError;
      if (turnError) throw turnError;
      if (extraError) throw extraError;
      if (staffError) throw staffError;

      setTaskList(listData as TaskList | null);
      setTurns((turnData ?? []) as TaskTurn[]);
      setExtras((extraData ?? []) as TaskExtra[]);
      setStaff(staffData ?? []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError(String((err as { message: unknown }).message));
      } else {
        setError('Görev detayı yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, [taskListId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refetch = fetchAll;

  return { taskList, turns, extras, staff, loading, error, refetch };
}

/** Confirms the current turn and rotates forward to the next unit. */
export async function confirmCurrentTurn(
  taskListId: string,
  turns: TaskTurn[],
  taskList: TaskList
): Promise<{ error: string | null }> {
  if (turns.length === 0) return { error: 'Nöbetçi sırası boş' };
  const currentIndex = taskList.current_turn_index;
  const currentTurn = turns[currentIndex];
  if (!currentTurn) return { error: 'Aktif nöbetçi bulunamadı' };

  const now = new Date().toISOString();
  const nextIndex = (currentIndex + 1) % turns.length;
  const newCycleDate = addDays(new Date().toISOString().slice(0, 10), taskList.cycle_days);

  const { error: turnError } = await supabase
    .from('task_turns')
    .update({ completed: true, last_completed_at: now })
    .eq('id', currentTurn.id);
  if (turnError) return { error: turnError.message };

  const { error: listError } = await supabase
    .from('task_lists')
    .update({
      current_turn_index: nextIndex,
      next_cycle_date: newCycleDate,
    })
    .eq('id', taskListId);
  if (listError) return { error: listError.message };

  return { error: null };
}

/** Retroactively records a completed past duty for a specific turn without advancing the queue. */
export async function recordPreviousDuty(
  turnId: string
): Promise<{ error: string | null }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('task_turns')
    .update({ completed: true, last_completed_at: now })
    .eq('id', turnId);
  return { error: error?.message ?? null };
}

/** Records an ad-hoc extra cleaning event without disrupting the rotation queue.
 * Pushes the next cleaning cycle date forward from today. */
export async function recordExtraCleaning(
  taskListId: string,
  taskList: TaskList,
  label: string,
  performedByStaffId: string | null,
  note: string | null
): Promise<{ error: string | null }> {
  const { error: insertError } = await supabase.from('task_extras').insert([
    {
      task_list_id: taskListId,
      label: label || null,
      performed_by_staff_id: performedByStaffId,
      note,
    },
  ]);
  if (insertError) return { error: insertError.message };

  const newCycleDate = addDays(new Date().toISOString().slice(0, 10), taskList.cycle_days);
  const { error: listError } = await supabase
    .from('task_lists')
    .update({ next_cycle_date: newCycleDate })
    .eq('id', taskListId);
  if (listError) return { error: listError.message };

  return { error: null };
}

/** Swap the position of two turns in the rotation (unit/ekip swap). */
export async function swapUnitSlots(
  turnAId: string,
  turnAPosition: number,
  turnBId: string,
  turnBPosition: number
): Promise<{ error: string | null }> {
  const { error: errA } = await supabase
    .from('task_turns')
    .update({ position: turnBPosition })
    .eq('id', turnAId);
  if (errA) return { error: errA.message };

  const { error: errB } = await supabase
    .from('task_turns')
    .update({ position: turnAPosition })
    .eq('id', turnBId);
  if (errB) return { error: errB.message };

  return { error: null };
}

/** Replace a single member within a turn's member_ids array (personal swap). */
export async function swapIndividualMember(
  turnId: string,
  newMemberIds: string[]
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('task_turns')
    .update({ member_ids: newMemberIds })
    .eq('id', turnId);
  return { error: error?.message ?? null };
}

/** Update a turn's label and members. */
export async function updateTurn(
  turnId: string,
  label: string,
  memberIds: string[]
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('task_turns')
    .update({ label, member_ids: memberIds })
    .eq('id', turnId);
  return { error: error?.message ?? null };
}

/** Create a new turn in a task list. */
export async function createTurn(
  taskListId: string,
  label: string,
  memberIds: string[],
  position: number
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('task_turns').insert([
    {
      task_list_id: taskListId,
      label,
      member_ids: memberIds,
      position,
    },
  ]);
  return { error: error?.message ?? null };
}

/** Delete a turn. */
export async function deleteTurn(turnId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('task_turns').delete().eq('id', turnId);
  return { error: error?.message ?? null };
}
