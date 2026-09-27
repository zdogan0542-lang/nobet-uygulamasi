/*
# Create task_lists, task_turns, task_extras tables

## Purpose
Implements a task-based rotation system inside duty groups. Each duty group
can have multiple "Task Lists" (e.g. "Lavabo Nöbeti", "Mutfak Nöbeti"). Each
task list has an ordered roster of "turns" — one per unit/member — that rotate
forward as duties are completed. An extra cleaning log table records ad-hoc
volunteer cleanings without disturbing the rotation queue.

## New Tables

### task_lists
- id (uuid, PK)
- duty_group_id (uuid, FK -> duty_groups.id ON DELETE CASCADE) — parent group
- name (text, NOT NULL) — e.g. "Lavabo Nöbeti"
- description (text, nullable) — optional description
- cycle_days (integer, NOT NULL, default 7) — expected interval between turns in days
- current_turn_index (integer, NOT NULL, default 0) — pointer into the ordered turn list
- next_cycle_date (date, NOT NULL, default CURRENT_DATE) — the date the current turn is due
- sort_order (integer, NOT NULL, default 0) — display ordering
- created_at (timestamptz, default now())

### task_turns
- id (uuid, PK)
- task_list_id (uuid, FK -> task_lists.id ON DELETE CASCADE)
- label (text, NOT NULL) — name of the unit/member slot (e.g. "A Ekibi" or "Ahmet Yılmaz")
- member_ids (text[], NOT NULL, default '{}') — array of staff IDs in this unit (can be empty)
- position (integer, NOT NULL, default 0) — order in the rotation
- last_completed_at (timestamptz, nullable) — when this turn was last completed
- completed (boolean, NOT NULL, default false) — whether this slot's current cycle is done
- created_at (timestamptz, default now())

### task_extras
- id (uuid, PK)
- task_list_id (uuid, FK -> task_lists.id ON DELETE CASCADE)
- label (text, nullable) — who/what did the extra cleaning (free text)
- performed_by_staff_id (uuid, nullable, FK -> staff.id ON DELETE SET NULL)
- note (text, nullable)
- performed_at (timestamptz, NOT NULL, default now())

## Security
- RLS enabled on all three tables.
- Single-tenant, no-auth app → all CRUD policies use TO anon, authenticated
  with USING (true) / WITH CHECK (true) since data is intentionally shared.

## Important Notes
1. Rotation logic (advancing current_turn_index, updating next_cycle_date) is
   handled by the application layer.
2. task_turns.member_ids is a text array of staff UUIDs so a single "unit" can
   group multiple members.
3. task_extras does NOT affect current_turn_index — it only shifts
   next_cycle_date forward from today.
*/

CREATE TABLE IF NOT EXISTS task_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duty_group_id uuid NOT NULL REFERENCES duty_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cycle_days integer NOT NULL DEFAULT 7,
  current_turn_index integer NOT NULL DEFAULT 0,
  next_cycle_date date NOT NULL DEFAULT CURRENT_DATE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_task_lists" ON task_lists;
CREATE POLICY "anon_select_task_lists" ON task_lists FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_task_lists" ON task_lists;
CREATE POLICY "anon_insert_task_lists" ON task_lists FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_task_lists" ON task_lists;
CREATE POLICY "anon_update_task_lists" ON task_lists FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_task_lists" ON task_lists;
CREATE POLICY "anon_delete_task_lists" ON task_lists FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS task_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_list_id uuid NOT NULL REFERENCES task_lists(id) ON DELETE CASCADE,
  label text NOT NULL,
  member_ids text[] NOT NULL DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  last_completed_at timestamptz,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_turns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_task_turns" ON task_turns;
CREATE POLICY "anon_select_task_turns" ON task_turns FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_task_turns" ON task_turns;
CREATE POLICY "anon_insert_task_turns" ON task_turns FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_task_turns" ON task_turns;
CREATE POLICY "anon_update_task_turns" ON task_turns FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_task_turns" ON task_turns;
CREATE POLICY "anon_delete_task_turns" ON task_turns FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS task_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_list_id uuid NOT NULL REFERENCES task_lists(id) ON DELETE CASCADE,
  label text,
  performed_by_staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  note text,
  performed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_extras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_task_extras" ON task_extras;
CREATE POLICY "anon_select_task_extras" ON task_extras FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_task_extras" ON task_extras;
CREATE POLICY "anon_insert_task_extras" ON task_extras FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_task_extras" ON task_extras;
CREATE POLICY "anon_update_task_extras" ON task_extras FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_task_extras" ON task_extras;
CREATE POLICY "anon_delete_task_extras" ON task_extras FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_task_lists_group ON task_lists(duty_group_id);
CREATE INDEX IF NOT EXISTS idx_task_turns_list ON task_turns(task_list_id);
CREATE INDEX IF NOT EXISTS idx_task_extras_list ON task_extras(task_list_id);