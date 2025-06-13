/*
  # Funciones avanzadas para gestión de administradores

  1. Funciones para gestión de suscripciones
    - Extender suscripciones por meses
    - Actualizar beneficios de planes
    - Gestionar propiedades destacadas

  2. Funciones para auditoría
    - Registro de cambios administrativos
    - Historial de modificaciones

  3. Políticas de seguridad mejoradas
    - Control granular de permisos
    - Validaciones de datos
*/

-- Función para extender suscripciones
CREATE OR REPLACE FUNCTION extend_subscription(
  subscription_id UUID,
  months_to_add INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario es administrador
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: se requieren permisos de administrador';
  END IF;

  -- Extender la suscripción
  UPDATE subscriptions 
  SET 
    ends_at = ends_at + (months_to_add || ' months')::INTERVAL,
    status = 'active',
    updated_at = NOW()
  WHERE id = subscription_id;
  
  -- Registrar la acción en auditoría
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    target_table,
    target_id,
    changes,
    created_at
  ) VALUES (
    auth.uid(),
    'extend_subscription',
    'subscriptions',
    subscription_id,
    jsonb_build_object('months_added', months_to_add),
    NOW()
  );
END;
$$;

-- Función para actualizar beneficios de plan
CREATE OR REPLACE FUNCTION update_plan_benefits(
  subscription_id UUID,
  new_plan_type TEXT,
  new_max_properties INTEGER DEFAULT NULL,
  new_featured_properties INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_plan_type TEXT;
  old_max_properties INTEGER;
  old_featured_properties INTEGER;
BEGIN
  -- Verificar que el usuario es administrador
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: se requieren permisos de administrador';
  END IF;

  -- Obtener valores actuales
  SELECT plan_type, max_properties, featured_properties
  INTO old_plan_type, old_max_properties, old_featured_properties
  FROM subscriptions
  WHERE id = subscription_id;

  -- Configurar beneficios por defecto según el plan
  IF new_max_properties IS NULL OR new_featured_properties IS NULL THEN
    CASE new_plan_type
      WHEN 'basic' THEN
        new_max_properties := COALESCE(new_max_properties, 1);
        new_featured_properties := COALESCE(new_featured_properties, 0);
      WHEN 'plan_100' THEN
        new_max_properties := COALESCE(new_max_properties, 2);
        new_featured_properties := COALESCE(new_featured_properties, 0);
      WHEN 'plan_300' THEN
        new_max_properties := COALESCE(new_max_properties, 5);
        new_featured_properties := COALESCE(new_featured_properties, 2);
      WHEN 'plan_500' THEN
        new_max_properties := COALESCE(new_max_properties, 10);
        new_featured_properties := COALESCE(new_featured_properties, 5);
      WHEN 'plan_1000' THEN
        new_max_properties := COALESCE(new_max_properties, 30);
        new_featured_properties := COALESCE(new_featured_properties, 15);
      WHEN 'plan_3000' THEN
        new_max_properties := COALESCE(new_max_properties, 100);
        new_featured_properties := COALESCE(new_featured_properties, 50);
      ELSE
        new_max_properties := COALESCE(new_max_properties, 1);
        new_featured_properties := COALESCE(new_featured_properties, 0);
    END CASE;
  END IF;

  -- Actualizar la suscripción
  UPDATE subscriptions 
  SET 
    plan_type = new_plan_type,
    max_properties = new_max_properties,
    featured_properties = new_featured_properties,
    updated_at = NOW()
  WHERE id = subscription_id;

  -- Registrar la acción en auditoría
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    target_table,
    target_id,
    changes,
    created_at
  ) VALUES (
    auth.uid(),
    'update_plan_benefits',
    'subscriptions',
    subscription_id,
    jsonb_build_object(
      'old_plan_type', old_plan_type,
      'new_plan_type', new_plan_type,
      'old_max_properties', old_max_properties,
      'new_max_properties', new_max_properties,
      'old_featured_properties', old_featured_properties,
      'new_featured_properties', new_featured_properties
    ),
    NOW()
  );
END;
$$;

-- Función para extender destacado de propiedades
CREATE OR REPLACE FUNCTION extend_property_featured(
  property_id UUID,
  days_to_add INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_featured_until TIMESTAMPTZ;
  new_featured_until TIMESTAMPTZ;
BEGIN
  -- Verificar que el usuario es administrador
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: se requieren permisos de administrador';
  END IF;

  -- Obtener fecha actual de destacado
  SELECT featured_until INTO current_featured_until
  FROM properties
  WHERE id = property_id;

  -- Calcular nueva fecha
  IF current_featured_until IS NULL OR current_featured_until < NOW() THEN
    new_featured_until := NOW() + (days_to_add || ' days')::INTERVAL;
  ELSE
    new_featured_until := current_featured_until + (days_to_add || ' days')::INTERVAL;
  END IF;

  -- Actualizar la propiedad
  UPDATE properties 
  SET 
    is_featured = true,
    featured_until = new_featured_until,
    updated_at = NOW()
  WHERE id = property_id;

  -- Registrar la acción en auditoría
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    target_table,
    target_id,
    changes,
    created_at
  ) VALUES (
    auth.uid(),
    'extend_property_featured',
    'properties',
    property_id,
    jsonb_build_object(
      'days_added', days_to_add,
      'old_featured_until', current_featured_until,
      'new_featured_until', new_featured_until
    ),
    NOW()
  );
END;
$$;

-- Tabla de auditoría para acciones administrativas
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para la tabla de auditoría
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_type ON admin_audit_log(action_type);

-- Habilitar RLS para la tabla de auditoría
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Política para que solo administradores puedan ver los logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Política para que solo administradores puedan insertar logs
CREATE POLICY "Admins can insert audit logs" ON admin_audit_log
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Función para obtener estadísticas de administración
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSONB;
BEGIN
  -- Verificar que el usuario es administrador
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: se requieren permisos de administrador';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_subscriptions', (SELECT COUNT(*) FROM subscriptions WHERE status = 'active'),
    'total_properties', (SELECT COUNT(*) FROM properties),
    'featured_properties', (SELECT COUNT(*) FROM properties WHERE is_featured = true),
    'properties_by_status', (
      SELECT jsonb_object_agg(status, count)
      FROM (
        SELECT status, COUNT(*) as count
        FROM properties
        GROUP BY status
      ) t
    ),
    'subscriptions_by_plan', (
      SELECT jsonb_object_agg(plan_type, count)
      FROM (
        SELECT plan_type, COUNT(*) as count
        FROM subscriptions
        WHERE status = 'active'
        GROUP BY plan_type
      ) t
    )
  ) INTO stats;

  RETURN stats;
END;
$$;