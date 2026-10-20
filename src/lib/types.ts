import type { ColorKey } from "./colors";

export interface DutyGroup {
  id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
}

export interface DutyList {
  id: string;
  group_id: string;
  name: string;
  color: string;
  cycle_days: number;
  current_assignee: string | null;
  current_start_date: string | null; // ISO date "YYYY-MM-DD"
  position: number;
  created_at: string;
}

export interface DutyAssignee {
  id: string;
  list_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface ListWithAssignees extends DutyList {
  assignees: DutyAssignee[];
}

export interface GroupWithLists extends DutyGroup {
  lists: ListWithAssignees[];
}

export type NewGroupInput = {
  name: string;
  color: ColorKey;
};

export type NewListInput = {
  group_id: string;
  name: string;
  color: ColorKey;
  cycle_days: number;
};
