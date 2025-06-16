
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      <Card className="p-4 sm:p-6 text-center dark:bg-gray-800 dark:border-gray-700">
        <h3 className="font-semibold mb-2 dark:text-white">Actualizar Plan</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          Mejora tu plan para más publicaciones y funciones
        </p>
        <Button onClick={() => { console.log("QuickActions: Ver Planes button clicked."); navigate('/plans'); }} className="w-full" size="sm">
          Ver Planes
        </Button>
      </Card>

      <Card className="p-4 sm:p-6 text-center dark:bg-gray-800 dark:border-gray-700">
        <h3 className="font-semibold mb-2 dark:text-white">Soporte</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          ¿Necesitas ayuda? Contacta con soporte
        </p>
        <Button 
          onClick={() => { console.log("QuickActions: WhatsApp button clicked."); window.open('https://wa.me/5217717789580', '_blank'); }}
          className="w-full bg-green-600 hover:bg-green-700"
          size="sm"
        >
          WhatsApp
        </Button>
      </Card>

      <Card className="p-4 sm:p-6 text-center dark:bg-gray-800 dark:border-gray-700">
        <h3 className="font-semibold mb-2 dark:text-white">Ver Propiedades</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          Explora todas las propiedades disponibles
        </p>
        <Button onClick={() => { console.log("QuickActions: Explorar (properties) button clicked."); navigate('/properties'); }} variant="outline" className="w-full" size="sm">
          Explorar
        </Button>
      </Card>
    </div>
  );
};

export default QuickActions;
