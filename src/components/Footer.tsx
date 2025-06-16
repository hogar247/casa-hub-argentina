import React from 'react';
import { Building, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Company Info */}
          <div className="space-y-4 col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2">
              <Building className="h-8 w-8 text-blue-400" />
              <h3 className="text-xl font-bold">InmobiliariaApp</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              Tu plataforma confiable para encontrar la propiedad perfecta en México. 
              Conectamos propietarios, agentes y compradores.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a href="/properties" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                  Propiedades
                </a>
              </li>
              <li>
                <a href="/properties/new" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                  Publicar Propiedad
                </a>
              </li>
              <li>
                <a href="/plans" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                  Planes de Suscripción
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Servicios</h4>
            <ul className="space-y-2">
              <li className="text-gray-300 text-sm sm:text-base">Venta de Propiedades</li>
              <li className="text-gray-300 text-sm sm:text-base">Alquiler de Inmuebles</li>
              <li className="text-gray-300 text-sm sm:text-base">Asesoría Inmobiliaria</li>
              <li className="text-gray-300 text-sm sm:text-base">Valuación de Propiedades</li>
              <li className="text-gray-300 text-sm sm:text-base">Administración de Rentas</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm sm:text-base">+52 55 1234 5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm sm:text-base break-all">contacto@inmobiliariaapp.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                <span className="text-gray-300 text-sm sm:text-base">
                  Av. Reforma 123, Col. Centro<br />
                  Ciudad de México, CDMX 06000
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-gray-400 text-sm text-center sm:text-left">
              © 2024 InmobiliariaApp. Todos los derechos reservados.
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-center">
                Términos y Condiciones
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-center">
                Política de Privacidad
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-center">
                Aviso Legal
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;