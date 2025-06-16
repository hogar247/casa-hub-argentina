
-- Insertar el usuario administrador en la tabla admin_users
-- Primero necesitamos obtener el user_id del usuario con email asesor.brandon@gmail.com
INSERT INTO admin_users (user_id, email, created_at, updated_at)
SELECT 
  id as user_id,
  'asesor.brandon@gmail.com' as email,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users 
WHERE email = 'asesor.brandon@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Si el usuario aún no existe en auth.users, podemos insertar un registro temporal
-- que se actualizará cuando el usuario se registre
INSERT INTO admin_users (email, created_at, updated_at)
SELECT 'asesor.brandon@gmail.com', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'asesor.brandon@gmail.com'
) AND NOT EXISTS (
  SELECT 1 FROM admin_users WHERE email = 'asesor.brandon@gmail.com'
);
