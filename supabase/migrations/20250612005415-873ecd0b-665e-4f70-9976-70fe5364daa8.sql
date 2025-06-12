
-- Corregir la tabla de suscripciones
ALTER TABLE public.subscriptions 
ALTER COLUMN plan_type SET DEFAULT 'basic';

-- Crear la tabla de administradores
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla de administradores
CREATE POLICY "Admin users can view all admin records" ON public.admin_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Super admin can insert admin users" ON public.admin_users
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Políticas para que administradores puedan ver todas las suscripciones
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Políticas para que administradores puedan ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Políticas para que administradores puedan ver todas las propiedades
CREATE POLICY "Admins can view all properties" ON public.properties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update all properties" ON public.properties
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Políticas para que usuarios puedan ver sus propias suscripciones
CREATE POLICY "Users can view own subscription" ON public.subscriptions
FOR SELECT USING (user_id = auth.uid());

-- Políticas para que usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

-- Políticas para propiedades (usuarios pueden ver sus propias propiedades)
CREATE POLICY "Users can view own properties" ON public.properties
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own properties" ON public.properties
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own properties" ON public.properties
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own properties" ON public.properties
FOR DELETE USING (user_id = auth.uid());

-- Insertar el primer administrador (usa tu email)
INSERT INTO public.admin_users (user_id, email) 
SELECT id, email FROM auth.users 
WHERE email = 'tu-email@ejemplo.com' 
ON CONFLICT (user_id) DO NOTHING;

-- Función para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = user_uuid
  );
$$;
