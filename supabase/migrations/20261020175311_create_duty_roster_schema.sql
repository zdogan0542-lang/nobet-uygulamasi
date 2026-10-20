/*
# Duty Roster Schema (single-tenant, no auth)

1. New Tables
- `duty_groups` — top-level grouping of duty lists (e.g. "Öğrenciler"). Has a preset accent color.
  - id (uuid, pk)
  - name (text, not null)
  - color (text, not null) — preset accent color key, e.g. "blue"
  - position (int, default 0) — manual ordering
  - created_at (timestamptz)
- `duty_lists` — a named recurring duty (e.g. "Süpürge nöbeti") within a group. Has its own preset accent color.
  - id (uuid, pk)
  - group_id (uuid, fk -> duty_groups.id on delete cascade)
  - name (text, not null)
  - color (text, not null) — preset accent color key
  - cycle_days (int, not null default 7) — rotation cycle length in days
  - current_assignee (text) — name of the person currently on duty
  - current_start_date (date) — start date of the current cycle
  - position (int, default 0)
  - created_at (timestamptz)
- `duty_assignees` — ordered list of assignees per duty list for rotation.
  - id (uuid, pk)
  - list_id (uuid, fk -> duty_lists.id on delete cascade)
  - name (text, not null)
  - position (int, default 0)
  - created_at (timestamptz)

2. Security
- Enable RLS on all tables.
- Single-tenant (no sign-in): allow anon + authenticated full CRUD since data is intentionally shared.
*/

CREATE TABLE IF NOT EXISTS duty_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT 'blue',
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS duty_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES duty_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'slate',
  cycle_days int NOT NULL DEFAULT 7,
  current_assignee text,
  current_start_date date,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS duty_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES duty_lists(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE duty_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_assignees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_duty_groups" ON duty_groups;
CREATE POLICY "anon_select_duty_groups" ON duty_groups FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_duty_groups" ON duty_groups;
CREATE POLICY "anon_insert_duty_groups" ON duty_groups FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_duty_groups" ON duty_groups;
CREATE POLICY "anon_update_duty_groups" ON duty_groups FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_duty_groups" ON duty_groups;
CREATE POLICY "anon_delete_duty_groups" ON duty_groups FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_duty_lists" ON duty_lists;
CREATE POLICY "anon_select_duty_lists" ON duty_lists FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_duty_lists" ON duty_lists;
CREATE POLICY "anon_insert_duty_lists" ON duty_lists FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_duty_lists" ON duty_lists;
CREATE POLICY "anon_update_duty_lists" ON duty_lists FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_duty_lists" ON duty_lists;
CREATE POLICY "anon_delete_duty_lists" ON duty_lists FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_duty_assignees" ON duty_assignees;
CREATE POLICY "anon_select_duty_assignees" ON duty_assignees FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_duty_assignees" ON duty_assignees;
CREATE POLICY "anon_insert_duty_assignees" ON duty_assignees FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_duty_assignees" ON duty_assignees;
CREATE POLICY "anon_update_duty_assignees" ON duty_assignees FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_duty_assignees" ON duty_assignees;
CREATE POLICY "anon_delete_duty_assignees" ON duty_assignees FOR DELETE
  TO anon, authenticated USING (true);
