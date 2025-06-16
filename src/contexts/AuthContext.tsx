import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Si hay usuario, crear o actualizar perfil
          if (session?.user) {
            await createOrUpdateProfile(session.user);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await createOrUpdateProfile(session.user);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const createOrUpdateProfile = async (user: User) => {
    try {
      // Verificar si el perfil ya existe
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', fetchError);
        return;
      }

      if (!existingProfile) {
        // Crear nuevo perfil
        const profileData = {
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          phone: user.user_metadata?.phone || '',
          user_type: user.user_metadata?.user_type || 'owner',
          company_name: user.user_metadata?.company_name || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('Profile created successfully for user:', user.id);
        }

        // Crear suscripción básica por defecto
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert([{
            user_id: user.id,
            plan_type: 'basic',
            status: 'active',
            max_properties: 1,
            featured_properties: 0,
            starts_at: new Date().toISOString(),
            ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 año
          }]);

        if (subscriptionError) {
          console.error('Error creating basic subscription:', subscriptionError);
        } else {
          console.log('Basic subscription created for user:', user.id);
        }
      } else {
        // Actualizar perfil existente si es necesario
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (user.email && user.email !== existingProfile.email) {
          updateData.email = user.email;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }
      }
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        console.error('SignUp error:', error);
        return { error };
      }

      console.log('SignUp successful:', data.user?.id);
      return { error: null };
    } catch (error) {
      console.error('SignUp exception:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('SignIn error:', error);
        return { error };
      }

      console.log('SignIn successful:', data.user?.id);
      return { error: null };
    } catch (error) {
      console.error('SignIn exception:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('SignOut error:', error);
      } else {
        console.log('SignOut successful');
      }
    } catch (error) {
      console.error('SignOut exception:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
