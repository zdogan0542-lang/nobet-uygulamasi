/*
# Add shift_type column and seed demo data

## Purpose
Supports the Nöbet Çizelgesi (Shift Schedule) module by:
1. Adding a `shift_type` column to the `duties` table to classify shifts as
   Gündüz (day), Gece (night), or 24 Saat (24-hour).
2. Seeding demo departments, staff, and duties so the calendar has content.

## Changes to existing tables

### duties (modified)
- `shift_type` (text, not null, default 'gunduz') — one of: 'gunduz', 'gece', '24saat'

## Seeded data
- 4 departments: Acil, Dahiliye, Cerrahi, Çocuk
- 8 staff members across departments
- ~20 duties spread across the current week with various shift types and statuses

## Security
- No RLS policy changes. Existing policies already allow anon + authenticated
  full CRUD on all tables (single-tenant, no-auth app).
*/

ALTER TABLE duties ADD COLUMN IF NOT EXISTS shift_type text NOT NULL DEFAULT 'gunduz';

-- Seed departments
INSERT INTO departments (id, name, color) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acil',     '#ef4444'),
  ('22222222-2222-2222-2222-222222222222', 'Dahiliye', '#3b82f6'),
  ('33333333-3333-3333-3333-333333333333', 'Cerrahi',  '#10b981'),
  ('44444444-4444-4444-4444-444444444444', 'Çocuk',    '#f59e0b')
ON CONFLICT (id) DO NOTHING;

-- Seed staff
INSERT INTO staff (id, full_name, title, department_id, phone, email, max_duties_per_month, active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dr. Ahmet Yılmaz',    'Uzman Doktor',  '11111111-1111-1111-1111-111111111111', '0532 111 22 33', 'ahmet@hastane.com', 10, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Dr. Ayşe Kaya',       'Asistan Doktor','11111111-1111-1111-1111-111111111111', '0532 222 33 44', 'ayse@hastane.com',  8, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Dr. Mehmet Demir',    'Uzman Doktor',  '22222222-2222-2222-2222-222222222222', '0532 333 44 55', 'mehmet@hastane.com',12, true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Hem. Fatma Şahin',    'Hemşire',      '22222222-2222-2222-2222-222222222222', '0532 444 55 66', 'fatma@hastane.com', 10, true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Dr. Can Öztürk',      'Başhekim',     '33333333-3333-3333-3333-333333333333', '0532 555 66 77', 'can@hastane.com',   6, true),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Dr. Zeynep Arslan',   'Asistan Doktor','33333333-3333-3333-3333-333333333333', '0532 666 77 88', 'zeynep@hastane.com', 8, true),
  ('99999999-9999-9999-9999-999999999999', 'Dr. Emre Doğan',      'Pratisyen Doktor','44444444-4444-4444-4444-444444444444', '0532 777 88 99', 'emre@hastane.com',  10, true),
  ('88888888-8888-8888-8888-888888888888', 'Hem. Selin Yıldız',   'Hemşire',      '44444444-4444-4444-4444-444444444444', '0532 888 99 00', 'selin@hastane.com', 10, false)
ON CONFLICT (id) DO NOTHING;

-- Seed duties across the current week
INSERT INTO duties (staff_id, department_id, duty_date, start_time, end_time, status, shift_type, notes)
SELECT staff_id, department_id, duty_date, start_time, end_time, status, shift_type, notes FROM (VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, (CURRENT_DATE)::date,     '08:00'::time, '20:00'::time, 'active'::text,    'gunduz'::text, NULL::text),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, (CURRENT_DATE)::date,     '20:00'::time, '08:00'::time, 'active'::text,    'gece'::text,   NULL::text),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, (CURRENT_DATE)::date,     '08:00'::time, '08:00'::time, 'active'::text,    '24saat'::text, NULL::text),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, (CURRENT_DATE + 1)::date, '08:00'::time, '20:00'::time, 'upcoming'::text,  'gunduz'::text, NULL::text),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, (CURRENT_DATE + 1)::date, '20:00'::time, '08:00'::time, 'upcoming'::text,  'gece'::text,   NULL::text),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, (CURRENT_DATE + 2)::date, '08:00'::time, '20:00'::time, 'upcoming'::text,  'gunduz'::text, NULL::text),
  ('99999999-9999-9999-9999-999999999999'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, (CURRENT_DATE + 2)::date, '08:00'::time, '08:00'::time, 'upcoming'::text,  '24saat'::text, NULL::text),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, (CURRENT_DATE + 3)::date, '20:00'::time, '08:00'::time, 'upcoming'::text,  'gece'::text,   NULL::text),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, (CURRENT_DATE + 3)::date, '08:00'::time, '20:00'::time, 'upcoming'::text,  'gunduz'::text, NULL::text),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, (CURRENT_DATE + 4)::date, '08:00'::time, '20:00'::time, 'upcoming'::text,  'gunduz'::text, NULL::text),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, (CURRENT_DATE + 4)::date, '08:00'::time, '08:00'::time, 'upcoming'::text,  '24saat'::text, NULL::text),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, (CURRENT_DATE + 5)::date, '20:00'::time, '08:00'::time, 'upcoming'::text,  'gece'::text,   NULL::text),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, (CURRENT_DATE + 5)::date, '08:00'::time, '20:00'::time, 'upcoming'::text,  'gunduz'::text, NULL::text),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, (CURRENT_DATE - 1)::date, '08:00'::time, '20:00'::time, 'completed'::text, 'gunduz'::text, NULL::text),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, (CURRENT_DATE - 1)::date, '20:00'::time, '08:00'::time, 'completed'::text, 'gece'::text,   NULL::text),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, (CURRENT_DATE - 2)::date, '08:00'::time, '08:00'::time, 'completed'::text, '24saat'::text, NULL::text),
  ('99999999-9999-9999-9999-999999999999'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, (CURRENT_DATE - 2)::date, '08:00'::time, '20:00'::time, 'completed'::text, 'gunduz'::text, NULL::text),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, (CURRENT_DATE - 3)::date, '20:00'::time, '08:00'::time, 'completed'::text, 'gece'::text,   NULL::text),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, (CURRENT_DATE - 3)::date, '08:00'::time, '20:00'::time, 'completed'::text, 'gunduz'::text, NULL::text),
  (NULL::uuid, '44444444-4444-4444-4444-444444444444'::uuid, (CURRENT_DATE + 6)::date, '08:00'::time, '20:00'::time, 'missed'::text, 'gunduz'::text, NULL::text),
  (NULL::uuid, '11111111-1111-1111-1111-111111111111'::uuid, (CURRENT_DATE + 6)::date, '20:00'::time, '08:00'::time, 'missed'::text, 'gece'::text,   NULL::text)
) AS t(staff_id, department_id, duty_date, start_time, end_time, status, shift_type, notes)
ON CONFLICT DO NOTHING;
