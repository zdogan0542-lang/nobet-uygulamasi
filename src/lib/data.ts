import { supabase } from "./supabase";
import type {
  DutyAssignee,
  DutyGroup,
  DutyList,
  GroupWithLists,
  ListWithAssignees,
  NewGroupInput,
  NewListInput,
} from "./types";

export async function fetchRoster(): Promise<GroupWithLists[]> {
  const [
    { data: groups, error: gErr },
    { data: lists, error: lErr },
    { data: assignees, error: aErr },
  ] = await Promise.all([
    supabase.from("duty_groups").select("*").order("position", { ascending: true }),
    supabase.from("duty_lists").select("*").order("position", { ascending: true }),
    supabase
      .from("duty_assignees")
      .select("*")
      .order("position", { ascending: true }),
  ]);

  if (gErr) throw gErr;
  if (lErr) throw lErr;
  if (aErr) throw aErr;

  const assigneeByList = new Map<string, DutyAssignee[]>();
  for (const a of assignees ?? []) {
    const arr = assigneeByList.get(a.list_id) ?? [];
    arr.push(a);
    assigneeByList.set(a.list_id, arr);
  }

  const listsByGroup = new Map<string, ListWithAssignees[]>();
  for (const l of (lists ?? []) as DutyList[]) {
    const enriched: ListWithAssignees = {
      ...l,
      assignees: assigneeByList.get(l.id) ?? [],
    };
    const arr = listsByGroup.get(l.group_id) ?? [];
    arr.push(enriched);
    listsByGroup.set(l.group_id, arr);
  }

  return ((groups ?? []) as DutyGroup[])
    .map((g) => ({ ...g, lists: listsByGroup.get(g.id) ?? [] }))
    .sort((a, b) => a.position - b.position);
}

export async function createGroup(input: NewGroupInput): Promise<void> {
  const { error } = await supabase.from("duty_groups").insert({
    name: input.name,
    color: input.color,
  });
  if (error) throw error;
}

export async function updateGroup(
  id: string,
  patch: Partial<Pick<DutyGroup, "name" | "color" | "position">>,
): Promise<void> {
  const { error } = await supabase.from("duty_groups").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteGroup(id: string): Promise<void> {
  const { error } = await supabase.from("duty_groups").delete().eq("id", id);
  if (error) throw error;
}

export async function createList(input: NewListInput): Promise<void> {
  const { error } = await supabase.from("duty_lists").insert({
    group_id: input.group_id,
    name: input.name,
    color: input.color,
    cycle_days: input.cycle_days,
  });
  if (error) throw error;
}

export async function updateList(
  id: string,
  patch: Partial<
    Pick<
      DutyList,
      "name" | "color" | "cycle_days" | "current_assignee" | "current_start_date" | "position"
    >
  >,
): Promise<void> {
  const { error } = await supabase.from("duty_lists").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteList(id: string): Promise<void> {
  const { error } = await supabase.from("duty_lists").delete().eq("id", id);
  if (error) throw error;
}

export async function addAssignee(listId: string, name: string): Promise<void> {
  const { error } = await supabase.from("duty_assignees").insert({
    list_id: listId,
    name,
  });
  if (error) throw error;
}

export async function deleteAssignee(id: string): Promise<void> {
  const { error } = await supabase.from("duty_assignees").delete().eq("id", id);
  if (error) throw error;
}
