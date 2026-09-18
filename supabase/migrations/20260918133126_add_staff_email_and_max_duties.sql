/*
# Add email and max_duties_per_month columns to staff table

## Purpose
Extends the staff table to support the Staff Management module requirements:
- Email address for contact info
- Maximum duties per month limit for scheduling constraints

## Changes to existing tables

### staff (modified)
- `email` (text, nullable) — staff member's email address for contact
- `max_duties_per_month` (integer, not null, default 10) — maximum number of
  duty shifts this person can be assigned per month

## Security
- No RLS policy changes. Existing policies already allow anon + authenticated
  full CRUD on the staff table (single-tenant, no-auth app).
*/

ALTER TABLE staff ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS max_duties_per_month integer NOT NULL DEFAULT 10;
