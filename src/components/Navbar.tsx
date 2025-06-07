
import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, Building, User, LogOut, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <Building className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                Soluciones Inmobiliarias
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Inicio</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate('/properties')}
              className="flex items-center space-x-2"
            >
              <Building className="h-4 w-4" />
              <span>Propiedades</span>
            </Button>

            {user ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
                
                <Button
                  onClick={() => navigate('/properties/new')}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Publicar</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                >
                  Iniciar Sesión
                </Button>
                <Button
                  onClick={() => navigate('/auth?tab=signup')}
                >
                  Registrarse
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
