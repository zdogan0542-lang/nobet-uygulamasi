import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { TaskList } from '@/lib/supabase';

export type TaskListInput = {
  name: string;
  description: string | null;
  color: string;
  cycle_days: number;
  sort_order: number;
};

export function useTaskLists(dutyGroupId: string | null) {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    if (!dutyGroupId) {
      setTaskLists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('task_lists')
        .select('*')
        .eq('duty_group_id', dutyGroupId)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setTaskLists(data ?? []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError(String((err as { message: unknown }).message));
      } else {
        setError('Görev listeleri yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, [dutyGroupId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const createList = useCallback(
    async (input: TaskListInput): Promise<{ error: string | null; data: TaskList | null }> => {
      if (!dutyGroupId) return { error: 'Grup seçili değil', data: null };
      const { data, error: insertError } = await supabase
        .from('task_lists')
        .insert([{ ...input, duty_group_id: dutyGroupId }])
        .select()
        .maybeSingle();
      if (insertError) return { error: insertError.message, data: null };
      await fetchLists();
      return { error: null, data: data as TaskList | null };
    },
    [dutyGroupId, fetchLists]
  );

  const updateList = useCallback(
    async (id: string, input: Partial<TaskListInput>): Promise<{ error: string | null }> => {
      const { error: updateError } = await supabase
        .from('task_lists')
        .update(input)
        .eq('id', id);
      if (updateError) return { error: updateError.message };
      await fetchLists();
      return { error: null };
    },
    [fetchLists]
  );

  const deleteList = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      const { error: deleteError } = await supabase
        .from('task_lists')
        .delete()
        .eq('id', id);
      if (deleteError) return { error: deleteError.message };
      await fetchLists();
      return { error: null };
    },
    [fetchLists]
  );

  return {
    taskLists,
    loading,
    error,
    createList,
    updateList,
    deleteList,
    refetch: fetchLists,
  };
}
