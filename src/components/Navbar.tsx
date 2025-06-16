
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Building, User, LogOut, Plus, CreditCard, Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      await signOut();
      setMobileMenuOpen(false);
      navigate('/');
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
              <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                InmoPlus
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/properties">
              <Button variant="ghost" className="dark:text-white dark:hover:bg-gray-800">
                Propiedades
              </Button>
            </Link>
            
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="dark:text-white dark:hover:bg-gray-800">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/properties/new">
                  <Button variant="ghost" className="dark:text-white dark:hover:bg-gray-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Publicar
                  </Button>
                </Link>
                <Link to="/plans">
                  <Button variant="ghost" className="dark:text-white dark:hover:bg-gray-800">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Planes
                  </Button>
                </Link>
                <Button 
                  onClick={handleSignOut} 
                  disabled={isSigningOut}
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isSigningOut ? 'Saliendo...' : 'Salir'}
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button className="dark:bg-blue-600 dark:hover:bg-blue-700">
                  Iniciar Sesión
                </Button>
              </Link>
            )}
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="dark:text-white dark:hover:bg-gray-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="dark:text-white dark:hover:bg-gray-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="dark:text-white dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t dark:border-gray-700 py-4">
            <div className="flex flex-col space-y-2">
              <Link to="/properties" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start dark:text-white dark:hover:bg-gray-800">
                  <Building className="h-4 w-4 mr-2" />
                  Propiedades
                </Button>
              </Link>
              
              {user ? (
                <>
                  <Link to="/dashboard" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start dark:text-white dark:hover:bg-gray-800">
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/properties/new" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start dark:text-white dark:hover:bg-gray-800">
                      <Plus className="h-4 w-4 mr-2" />
                      Publicar Propiedad
                    </Button>
                  </Link>
                  <Link to="/plans" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start dark:text-white dark:hover:bg-gray-800">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Planes
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleSignOut} 
                    disabled={isSigningOut}
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isSigningOut ? 'Cerrando Sesión...' : 'Cerrar Sesión'}
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={closeMobileMenu}>
                  <Button className="w-full dark:bg-blue-600 dark:hover:bg-blue-700">
                    Iniciar Sesión
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
