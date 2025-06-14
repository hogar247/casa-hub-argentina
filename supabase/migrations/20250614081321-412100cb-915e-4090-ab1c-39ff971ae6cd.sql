
-- Agregar políticas RLS para la tabla admin_users para evitar recursión infinita
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Política para que los administradores puedan ver todos los registros de admin_users
CREATE POLICY "Admins can view all admin users" 
ON public.admin_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Política para que solo super administradores puedan insertar nuevos admin users
CREATE POLICY "Super admins can insert admin users" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users 
    WHERE email = 'asesor.brandon@gmail.com'
  )
);

-- Política para que solo super administradores puedan actualizar admin users
CREATE POLICY "Super admins can update admin users" 
ON public.admin_users 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users 
    WHERE email = 'asesor.brandon@gmail.com'
  )
);

-- Política para que solo super administradores puedan eliminar admin users
CREATE POLICY "Super admins can delete admin users" 
ON public.admin_users 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users 
    WHERE email = 'asesor.brandon@gmail.com'
  )
);

-- Actualizar la función is_admin para evitar recursión
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = user_uuid
  );
$function$;
