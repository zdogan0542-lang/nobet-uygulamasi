/*
# Create duty_groups table and link staff/duties to groups

## Purpose
Introduces the "Nöbet Grupları" (Duty Groups) structure, adapting the old
medical-department concept into configurable duty groups. Each group carries
its own scheduling rules: maximum duties per month and minimum rest hours
between shifts.

## New Tables
### duty_groups
- id (uuid, primary key)
- name (text, not null) — group name (e.g. "Acil Nöbet Grubu")
- color (text, not null, default '#3b82f6') — hex color for UI display
- max_duties_per_month (integer, not null, default 10) — per-group monthly duty cap
- min_rest_hours (integer, not null, default 24) — minimum rest hours between shifts
- created_at (timestamptz, default now())

## Modified Tables
### staff
- duty_group_id (uuid, nullable, FK → duty_groups.id ON DELETE SET NULL)
  Links a staff member to a duty group (replaces department_id going forward).

### duties
- duty_group_id (uuid, nullable, FK → duty_groups.id ON DELETE SET NULL)
  Links a duty assignment to a duty group.

## Data Migration
1. Copies existing departments into duty_groups, preserving the same UUIDs,
   names, and colors. Default rule values: max_duties_per_month = 10,
   min_rest_hours = 24.
2. Back-fills staff.duty_group_id from department_id for all existing staff.
3. Back-fills duties.duty_group_id from department_id for all existing duties.
The departments table and department_id columns are retained for backward
compatibility during the transition; they will be removed in a later step.

## Security
- RLS enabled on duty_groups with anon + authenticated full CRUD
  (single-tenant, no-auth app — same pattern as all other tables).
- Indexes added on staff.duty_group_id and duties.duty_group_id.

## Important Notes
1. This migration is idempotent — safe to re-run.
2. No existing data is deleted or altered destructively.
3. duty_groups rows inherit the UUIDs of their source departments, so all
   existing foreign-key references remain valid after back-fill.
*/

CREATE TABLE IF NOT EXISTS duty_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  max_duties_per_month integer NOT NULL DEFAULT 10,
  min_rest_hours integer NOT NULL DEFAULT 24,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on duty_groups
ALTER TABLE duty_groups ENABLE ROW LEVEL SECURITY;

-- duty_groups policies (single-tenant, no-auth → anon + authenticated)
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

-- Add duty_group_id columns to staff and duties
ALTER TABLE staff ADD COLUMN IF NOT EXISTS duty_group_id uuid REFERENCES duty_groups(id) ON DELETE SET NULL;
ALTER TABLE duties ADD COLUMN IF NOT EXISTS duty_group_id uuid REFERENCES duty_groups(id) ON DELETE SET NULL;

-- Migrate existing departments into duty_groups (preserve UUIDs)
INSERT INTO duty_groups (id, name, color, max_duties_per_month, min_rest_hours)
SELECT id, name, color, 10, 24
FROM departments
WHERE id NOT IN (SELECT id FROM duty_groups)
ON CONFLICT (id) DO NOTHING;

-- Back-fill staff.duty_group_id from department_id
UPDATE staff
SET duty_group_id = department_id
WHERE duty_group_id IS NULL AND department_id IS NOT NULL;

-- Back-fill duties.duty_group_id from department_id
UPDATE duties
SET duty_group_id = department_id
WHERE duty_group_id IS NULL AND department_id IS NOT NULL;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_staff_duty_group ON staff(duty_group_id);
CREATE INDEX IF NOT EXISTS idx_duties_duty_group ON duties(duty_group_id);