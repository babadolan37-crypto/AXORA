-- Script untuk membuat User Dummy (Palsu) untuk testing
-- Password untuk semua user ini adalah: 123456

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Buat User Manager (Budi)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'manager@contoh.com',
    crypt('123456', gen_salt('bf')),
    now(), -- Langsung dikonfirmasi
    '{"full_name": "Budi Manager"}',
    now(),
    now()
);

-- 2. Buat User Staff (Siti)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'staff@contoh.com',
    crypt('123456', gen_salt('bf')),
    now(),
    '{"full_name": "Siti Staff"}',
    now(),
    now()
);

-- 3. Buat User Viewer (Andi)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'viewer@contoh.com',
    crypt('123456', gen_salt('bf')),
    now(),
    '{"full_name": "Andi Viewer"}',
    now(),
    now()
);

-- 4. Update Role mereka di tabel user_profiles (karena defaultnya admin)
-- Kita beri jeda sedikit atau gunakan subquery karena trigger berjalan async/sync
DO $$
BEGIN
  -- Update Budi jadi Manager
  UPDATE public.user_profiles 
  SET role = 'manager' 
  WHERE email = 'manager@contoh.com';

  -- Update Siti jadi Employee
  UPDATE public.user_profiles 
  SET role = 'employee' 
  WHERE email = 'staff@contoh.com';

  -- Update Andi jadi Viewer
  UPDATE public.user_profiles 
  SET role = 'viewer' 
  WHERE email = 'viewer@contoh.com';
END $$;
