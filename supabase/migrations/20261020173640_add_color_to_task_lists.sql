/*
# Add color column to task_lists

## Purpose
Allows each duty list (e.g. "Lavabo Nöbeti", "Mutfak Nöbeti") to carry its own
custom accent color, chosen by the user from a preset palette when creating or
editing the list. This color is used in the Dashboard cards as a distinct
colored badge/accent so individual lists are visually distinguishable beyond
their parent duty group's color.

## Modified Tables
### task_lists
- color (text, NOT NULL, default '#6366f1') — hex color string for UI accent.
  Defaults to indigo when a list is created without an explicit color choice.

## Security
- No RLS or policy changes. task_lists already has anon + authenticated CRUD.

## Important Notes
1. Idempotent — safe to re-run (uses ADD COLUMN IF NOT EXISTS).
2. No existing data is deleted or altered destructively.
3. Existing task_lists rows receive the default '#6366f1' automatically.
*/

ALTER TABLE task_lists ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#6366f1';
