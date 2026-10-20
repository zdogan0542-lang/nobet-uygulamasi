import { supabase, supabaseAvailable } from "./supabase";
import type {
  DutyAssignee,
  DutyGroup,
  DutyList,
  GroupWithLists,
  ListWithAssignees,
  NewGroupInput,
  NewListInput,
} from "./types";
import { todayISO } from "./dates";

/**
 * Fallback mock roster used when Supabase env vars are missing or the
 * database is unreachable, so the UI always renders something.
 */
const MOCK_GROUPS: GroupWithLists[] = (() => {
  const today = todayISO();
  const mk = (
    id: string,
    name: string,
    color: string,
    lists: ListWithAssignees[],
  ): GroupWithLists => ({
    id,
    name,
    color,
    position: 0,
    created_at: new Date().toISOString(),
    lists,
  });
  const mkList = (
    id: string,
    groupId: string,
    name: string,
    color: string,
    assignee: string,
    assignees: string[],
  ): ListWithAssignees => ({
    id,
    group_id: groupId,
    name,
    color,
    cycle_days: 7,
    current_assignee: assignee,
    current_start_date: today,
    position: 0,
    created_at: new Date().toISOString(),
    assignees: assignees.map((n, i) => ({
      id: `${id}-a${i}`,
      list_id: id,
      name: n,
      position: i,
      created_at: new Date().toISOString(),
    })),
  });
  return [
    mk("g1", "Öğrenciler", "pink", [
      mkList("l1", "g1", "Süpürge nöbeti", "amber", "Ayşe Yılmaz", [
        "Ayşe Yılmaz",
        "Burak Şahin",
        "Elif Aydın",
        "Deniz Çelik",
      ]),
      mkList("l2", "g1", "Lavabo dizini", "teal", "Mehmet Demir", [
        "Mehmet Demir",
        "Selin Arslan",
        "Kerem Yıldız",
      ]),
    ]),
    mk("g2", "Dahiliye", "blue", [
      mkList("l3", "g2", "Gece nöbeti", "blue", "Zeynep Kaya", [
        "Zeynep Kaya",
        "Ahmet Polat",
        "Deniz Çelik",
        "Merve Koç",
      ]),
    ]),
    mk("g3", "Acil", "rose", [
      mkList("l4", "g3", "Acil triyaj", "rose", "Can Öztürk", [
        "Can Öztürk",
        "Selin Arslan",
        "Burak Şahin",
      ]),
    ]),
  ];
})();

export async function fetchRoster(): Promise<GroupWithLists[]> {
  if (!supabase || !supabaseAvailable) return MOCK_GROUPS;

  try {
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

    const result = ((groups ?? []) as DutyGroup[])
      .map((g) => ({ ...g, lists: listsByGroup.get(g.id) ?? [] }))
      .sort((a, b) => a.position - b.position);

    return result.length > 0 ? result : MOCK_GROUPS;
  } catch {
    return MOCK_GROUPS;
  }
}

export async function createGroup(input: NewGroupInput): Promise<void> {
  if (!supabase) return;
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
  if (!supabase) return;
  const { error } = await supabase.from("duty_groups").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteGroup(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("duty_groups").delete().eq("id", id);
  if (error) throw error;
}

export async function createList(input: NewListInput): Promise<void> {
  if (!supabase) return;
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
      | "name"
      | "color"
      | "cycle_days"
      | "current_assignee"
      | "current_start_date"
      | "position"
    >
  >,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("duty_lists").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteList(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("duty_lists").delete().eq("id", id);
  if (error) throw error;
}

export async function addAssignee(listId: string, name: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("duty_assignees").insert({
    list_id: listId,
    name,
  });
  if (error) throw error;
}

export async function deleteAssignee(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("duty_assignees").delete().eq("id", id);
  if (error) throw error;
}
