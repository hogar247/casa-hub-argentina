
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Building, User, LogOut, Plus, CreditCard } from 'lucide-react';

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
            <Link to="/" className="flex items-center space-x-2">
              <Building className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                InmoPlus
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/properties">
              <Button variant="ghost">Propiedades</Button>
            </Link>
            
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/properties/new">
                  <Button variant="ghost">
                    <Plus className="h-4 w-4 mr-2" />
                    Publicar
                  </Button>
                </Link>
                <Link to="/plans">
                  <Button variant="ghost">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Planes
                  </Button>
                </Link>
                <Button onClick={handleSignOut} variant="ghost">
                  <LogOut className="h-4 w-4 mr-2" />
                  Salir
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button>Iniciar Sesión</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
