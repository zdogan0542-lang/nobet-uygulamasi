/*
# Seed sample duty roster data

1. Purpose
- Populate duty_groups, duty_lists, and duty_assignees with realistic sample
  data so the Dashboard shows active duty cards immediately on first load.
- Idempotent: only inserts when the tables are empty.

2. Groups seeded
- "Öğrenciler" (pink)
- "Dahiliye" (blue)
- "Acil" (rose)

3. Lists seeded
- Under Öğrenciler: "Süpürge nöbeti" (amber), "Lavabo dizini" (teal)
- Under Dahiliye: "Gece nöbeti" (blue)
- Under Acil: "Acil triyaj" (rose)

4. Assignees + current rotation
- Each list gets 3-4 assignees and an active current_assignee with a
  current_start_date of today (2026-10-20) so cards appear active.
*/

DO $$
DECLARE
  g_ogrenciler uuid;
  g_dahiliye uuid;
  g_acil uuid;
  l_supurge uuid;
  l_lavabo uuid;
  l_gece uuid;
  l_triyaj uuid;
  today_date date := '2026-10-20';
BEGIN
  IF (SELECT count(*) FROM duty_groups) > 0 THEN
    RETURN;
  END IF;

  -- Groups
  INSERT INTO duty_groups (name, color, position)
  VALUES ('Öğrenciler', 'pink', 0)
  RETURNING id INTO g_ogrenciler;

  INSERT INTO duty_groups (name, color, position)
  VALUES ('Dahiliye', 'blue', 1)
  RETURNING id INTO g_dahiliye;

  INSERT INTO duty_groups (name, color, position)
  VALUES ('Acil', 'rose', 2)
  RETURNING id INTO g_acil;

  -- Öğrenciler lists
  INSERT INTO duty_lists (group_id, name, color, cycle_days, current_assignee, current_start_date, position)
  VALUES (g_ogrenciler, 'Süpürge nöbeti', 'amber', 7, 'Ayşe Yılmaz', today_date, 0)
  RETURNING id INTO l_supurge;

  INSERT INTO duty_lists (group_id, name, color, cycle_days, current_assignee, current_start_date, position)
  VALUES (g_ogrenciler, 'Lavabo dizini', 'teal', 7, 'Mehmet Demir', today_date, 1)
  RETURNING id INTO l_lavabo;

  -- Dahiliye list
  INSERT INTO duty_lists (group_id, name, color, cycle_days, current_assignee, current_start_date, position)
  VALUES (g_dahiliye, 'Gece nöbeti', 'blue', 7, 'Zeynep Kaya', today_date, 0)
  RETURNING id INTO l_gece;

  -- Acil list
  INSERT INTO duty_lists (group_id, name, color, cycle_days, current_assignee, current_start_date, position)
  VALUES (g_acil, 'Acil triyaj', 'rose', 7, 'Can Öztürk', today_date, 0)
  RETURNING id INTO l_triyaj;

  -- Assignees for Süpürge nöbeti
  INSERT INTO duty_assignees (list_id, name, position) VALUES
    (l_supurge, 'Ayşe Yılmaz', 0),
    (l_supurge, 'Burak Şahin', 1),
    (l_supurge, 'Elif Aydın', 2),
    (l_supurge, 'Deniz Çelik', 3);

  -- Assignees for Lavabo dizini
  INSERT INTO duty_assignees (list_id, name, position) VALUES
    (l_lavabo, 'Mehmet Demir', 0),
    (l_lavabo, 'Selin Arslan', 1),
    (l_lavabo, 'Kerem Yıldız', 2);

  -- Assignees for Gece nöbeti
  INSERT INTO duty_assignees (list_id, name, position) VALUES
    (l_gece, 'Zeynep Kaya', 0),
    (l_gece, 'Ahmet Polat', 1),
    (l_gece, 'Deniz Çelik', 2),
    (l_gece, 'Merve Koç', 3);

  -- Assignees for Acil triyaj
  INSERT INTO duty_assignees (list_id, name, position) VALUES
    (l_triyaj, 'Can Öztürk', 0),
    (l_triyaj, 'Selin Arslan', 1),
    (l_triyaj, 'Burak Şahin', 2);
END $$;
