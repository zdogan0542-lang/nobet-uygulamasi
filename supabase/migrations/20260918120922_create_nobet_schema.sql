/*
# Nöbet Takip Sistemi — Initial Schema

## Purpose
Creates the core tables for a hospital shift/duty tracking system (Nöbet Takip Sistemi).
This is a single-tenant app with no sign-in screen, so all policies allow both
anon and authenticated roles to read/write — the data is intentionally shared.

## New Tables

### departments
- `id` (uuid, primary key)
- `name` (text, not null) — department name (e.g. "Acil", "Cerrahi")
- `color` (text, not null) — hex color code for UI display
- `created_at` (timestamptz, default now())

### staff
- `id` (uuid, primary key)
- `full_name` (text, not null) — full name of the staff member
- `title` (text, not null) — job title (e.g. "Doktor", "Hemşire")
- `department_id` (uuid, foreign key → departments.id)
- `phone` (text, nullable) — phone number
- `active` (boolean, default true) — whether the staff member is currently active
- `created_at` (timestamptz, default now())

### duties
- `id` (uuid, primary key)
- `staff_id` (uuid, foreign key → staff.id) — who is assigned
- `department_id` (uuid, foreign key → departments.id) — which department
- `duty_date` (date, not null) — the date of the shift
- `start_time` (time, not null) — shift start (e.g. "08:00")
- `end_time` (time, not null) — shift end (e.g. "20:00")
- `status` (text, not null, default 'upcoming') — one of: 'active', 'upcoming', 'completed', 'missed'
- `notes` (text, nullable) — optional notes
- `created_at` (timestamptz, default now())

## Security
- RLS enabled on all three tables.
- All tables use `TO anon, authenticated` policies (single-tenant, no auth screen).
- Full CRUD allowed for both anon and authenticated roles since data is shared/public.
*/

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  title text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  phone text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS duties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  duty_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE duties ENABLE ROW LEVEL SECURITY;

-- departments policies
DROP POLICY IF EXISTS "anon_select_departments" ON departments;
CREATE POLICY "anon_select_departments" ON departments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_departments" ON departments;
CREATE POLICY "anon_insert_departments" ON departments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_departments" ON departments;
CREATE POLICY "anon_update_departments" ON departments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_departments" ON departments;
CREATE POLICY "anon_delete_departments" ON departments FOR DELETE
  TO anon, authenticated USING (true);

-- staff policies
DROP POLICY IF EXISTS "anon_select_staff" ON staff;
CREATE POLICY "anon_select_staff" ON staff FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_staff" ON staff;
CREATE POLICY "anon_insert_staff" ON staff FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_staff" ON staff;
CREATE POLICY "anon_update_staff" ON staff FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_staff" ON staff;
CREATE POLICY "anon_delete_staff" ON staff FOR DELETE
  TO anon, authenticated USING (true);

-- duties policies
DROP POLICY IF EXISTS "anon_select_duties" ON duties;
CREATE POLICY "anon_select_duties" ON duties FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_duties" ON duties;
CREATE POLICY "anon_insert_duties" ON duties FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_duties" ON duties;
CREATE POLICY "anon_update_duties" ON duties FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_duties" ON duties;
CREATE POLICY "anon_delete_duties" ON duties FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department_id);
CREATE INDEX IF NOT EXISTS idx_duties_staff ON duties(staff_id);
CREATE INDEX IF NOT EXISTS idx_duties_department ON duties(department_id);
CREATE INDEX IF NOT EXISTS idx_duties_date ON duties(duty_date);
