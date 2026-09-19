/*
# Create swap_requests table

## Purpose
Allows staff members to request shift swaps / duty handovers with another staff member.
Supports a Pending -> Approved/Rejected workflow. When approved, the duty's
staff_id is transferred to the target staff member automatically by the application.

## New Tables
- `swap_requests`
  - `id` (uuid, PK)
  - `duty_id` (uuid, FK -> duties.id, NOT NULL) — the duty being swapped
  - `from_staff_id` (uuid, FK -> staff.id, NOT NULL) — current staff assigned to the duty
  - `to_staff_id` (uuid, FK -> staff.id, NOT NULL) — staff who will take over
  - `status` (text, NOT NULL, DEFAULT 'pending') — one of 'pending', 'approved', 'rejected'
  - `reason` (text, nullable) — optional reason for the swap
  - `created_at` (timestamptz, DEFAULT now())
  - `updated_at` (timestamptz, DEFAULT now())
  - `resolved_at` (timestamptz, nullable) — when the request was approved/rejected

## Security
- RLS enabled on `swap_requests`.
- Single-tenant app (no auth screen) so all CRUD policies use `TO anon, authenticated`
  with `USING (true)` / `WITH CHECK (true)` since the data is intentionally shared.

## Notes
1. No `user_id` column — this app has no sign-in screen.
2. The application layer enforces swap validation (rest hours, overlapping shifts).
3. On approval, the app updates the related duty's `staff_id` to `to_staff_id`.
*/

CREATE TABLE IF NOT EXISTS swap_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duty_id uuid NOT NULL REFERENCES duties(id) ON DELETE CASCADE,
  from_staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  to_staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_swap_requests" ON swap_requests;
CREATE POLICY "anon_select_swap_requests"
ON swap_requests FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_swap_requests" ON swap_requests;
CREATE POLICY "anon_insert_swap_requests"
ON swap_requests FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_swap_requests" ON swap_requests;
CREATE POLICY "anon_update_swap_requests"
ON swap_requests FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_swap_requests" ON swap_requests;
CREATE POLICY "anon_delete_swap_requests"
ON swap_requests FOR DELETE
TO anon, authenticated USING (true);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_swap_requests_duty_id ON swap_requests(duty_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_to_staff_id ON swap_requests(to_staff_id);
