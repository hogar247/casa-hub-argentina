
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, DollarSign, Bed, Bath, Car, Wifi, Dog, Shield, Building, Waves, Dumbbell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  operation_type: string;
  address: string;
  city: string;
  province: string;
  bedrooms: number | null;
  bathrooms: number | null;
  surface_total: number | null;
  parking_spaces: number | null;
  status: string;
  created_at: string;
  views_count: number;
  features: any[];
  user_id: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    user_type?: string;
  };
  subscriptions?: {
    plan_type?: string;
  }[];
}

const mexicoStatesAndMunicipalities = {
  "Aguascalientes": ["Aguascalientes","Asientos","Calvillo","Cosio","El Llano","Jesus Maria","Pabellon de Arteaga","Rincon de Romos","San Francisco de los Romo","San Jose de Gracia","Tepezala"],
  "Baja California": ["Ensenada","Mexicali","Playas de Rosarito","Tecate","Tijuana"],
  "Baja California Sur": ["Comondu","La Paz","Loreto","Los Cabos","Mulege"],
  "Ciudad de Mexico": ["Alvaro Obregon","Azcapotzalco","Benito Juarez","Coyoacan","Cuajimalpa de Morelos","Cuauhtemoc","Gustavo A. Madero","Iztacalco","Iztapalapa","La Magdalena Contreras","Miguel Hidalgo","Milpa Alta","Tlalpan","Tlahuac","Venustiano Carranza","Xochimilco"],
  "Jalisco": ["Guadalajara","Zapopan","Tlaquepaque","Tonala","Puerto Vallarta","Lagos de Moreno","Tepatitlan de Morelos"],
  "Estado de Mexico": ["Toluca","Ecatepec de Morelos","Nezahualcoyotl","Naucalpan de Juarez","Tlalnepantla de Baz","Chimalhuacan","Cuautitlan Izcalli"]
};

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [operationType, setOperationType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [allowsPets, setAllowsPets] = useState('');
  const [furnished, setFurnished] = useState('');
  const [hasParking, setHasParking] = useState('');
  const [hasWifi, setHasWifi] = useState('');
  const [hasPool, setHasPool] = useState('');
  const [hasGym, setHasGym] = useState('');
  const [hasSecurity, setHasSecurity] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, searchTerm, selectedState, selectedMunicipality, operationType, minPrice, maxPrice, bedrooms, allowsPets, furnished, hasParking, hasWifi, hasPool, hasGym, hasSecurity]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_user_id_fkey (
            first_name,
            last_name,
            phone,
            user_type
          ),
          subscriptions!subscriptions_user_id_fkey (
            plan_type
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (selectedState) {
      filtered = filtered.filter(property => property.province === selectedState);
    }

    // Filtro por municipio
    if (selectedMunicipality && selectedMunicipality !== 'Otro') {
      filtered = filtered.filter(property => property.city === selectedMunicipality);
    }

    // Filtro por tipo de operación
    if (operationType) {
      filtered = filtered.filter(property => property.operation_type === operationType);
    }

    // Filtro por precio
    if (minPrice) {
      filtered = filtered.filter(property => property.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(property => property.price <= parseFloat(maxPrice));
    }

    // Filtro por dormitorios
    if (bedrooms) {
      filtered = filtered.filter(property => property.bedrooms === parseInt(bedrooms));
    }

    // Filtros de características
    if (allowsPets === 'true') {
      filtered = filtered.filter(property => 
        property.features?.includes('pets') || 
        property.features?.includes('mascotas')
      );
    }

    if (furnished === 'true') {
      filtered = filtered.filter(property => 
        property.features?.includes('furnished') || 
        property.features?.includes('amueblado')
      );
    }

    if (hasParking === 'true') {
      filtered = filtered.filter(property => 
        property.parking_spaces && property.parking_spaces > 0
      );
    }

    if (hasWifi === 'true') {
      filtered = filtered.filter(property => 
        property.features?.includes('wifi')
      );
    }

    if (hasPool === 'true') {
      filtered = filtered.filter(property => 
        property.features?.includes('pool') || 
        property.features?.includes('piscina')
      );
    }

    if (hasGym === 'true') {
      filtered = filtered.filter(property => 
        property.features?.includes('gym') || 
        property.features?.includes('gimnasio')
      );
    }

    if (hasSecurity === 'true') {
      filtered = filtered.filter(property => 
        property.features?.includes('security') || 
        property.features?.includes('seguridad')
      );
    }

    setFilteredProperties(filtered);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'MXN',
    }).format(price);
  };

  const getUserFrame = (subscriptions: any[]) => {
    if (!subscriptions || subscriptions.length === 0) return 'basic';
    const subscription = subscriptions[0];
    return subscription?.plan_type || 'basic';
  };

  const getFrameStyle = (planType: string) => {
    switch (planType) {
      case 'plan_100':
        return 'border-2 border-blue-400 shadow-lg';
      case 'plan_300':
        return 'border-2 border-green-400 shadow-lg';
      case 'plan_500':
        return 'border-2 border-purple-400 shadow-lg';
      case 'plan_1000':
        return 'border-4 border-yellow-400 shadow-xl bg-gradient-to-r from-yellow-50 to-orange-50';
      case 'plan_3000':
        return 'border-4 border-gradient-to-r from-pink-500 to-purple-600 shadow-2xl bg-gradient-to-r from-pink-50 to-purple-50 animate-pulse';
      default:
        return 'border border-gray-200';
    }
  };

  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'plan_100':
        return <Badge className="bg-blue-500">Básico Plus</Badge>;
      case 'plan_300':
        return <Badge className="bg-green-500">Estándar</Badge>;
      case 'plan_500':
        return <Badge className="bg-purple-500">Premium</Badge>;
      case 'plan_1000':
        return <Badge className="bg-yellow-500">Premium Gold</Badge>;
      case 'plan_3000':
        return <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">VIP Elite</Badge>;
      default:
        return <Badge variant="outline">Básico</Badge>;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState('');
    setSelectedMunicipality('');
    setOperationType('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setAllowsPets('');
    setFurnished('');
    setHasParking('');
    setHasWifi('');
    setHasPool('');
    setHasGym('');
    setHasSecurity('');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p>Cargando propiedades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Propiedades Disponibles</h1>
        
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Búsqueda general */}
              <div className="lg:col-span-2">
                <Input
                  placeholder="Buscar por título, descripción, ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Tipo de operación */}
              <Select value={operationType} onValueChange={setOperationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de operación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Venta</SelectItem>
                  <SelectItem value="rent">Alquiler</SelectItem>
                </SelectContent>
              </Select>

              {/* Estado */}
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(mexicoStatesAndMunicipalities).map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Municipio */}
              <Select 
                value={selectedMunicipality} 
                onValueChange={setSelectedMunicipality}
                disabled={!selectedState}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Municipio" />
                </SelectTrigger>
                <SelectContent>
                  {selectedState && mexicoStatesAndMunicipalities[selectedState as keyof typeof mexicoStatesAndMunicipalities]?.map((municipality) => (
                    <SelectItem key={municipality} value={municipality}>
                      {municipality}
                    </SelectItem>
                  ))}
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>

              {/* Precio mínimo */}
              <Input
                type="number"
                placeholder="Precio mínimo"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />

              {/* Precio máximo */}
              <Input
                type="number"
                placeholder="Precio máximo"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />

              {/* Dormitorios */}
              <Select value={bedrooms} onValueChange={setBedrooms}>
                <SelectTrigger>
                  <SelectValue placeholder="Dormitorios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtros de características */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-4">
              <Select value={allowsPets} onValueChange={setAllowsPets}>
                <SelectTrigger>
                  <SelectValue placeholder="Mascotas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sí acepta</SelectItem>
                  <SelectItem value="false">No acepta</SelectItem>
                </SelectContent>
              </Select>

              <Select value={furnished} onValueChange={setFurnished}>
                <SelectTrigger>
                  <SelectValue placeholder="Amueblado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Amueblado</SelectItem>
                  <SelectItem value="false">Sin muebles</SelectItem>
                </SelectContent>
              </Select>

              <Select value={hasParking} onValueChange={setHasParking}>
                <SelectTrigger>
                  <SelectValue placeholder="Parking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Con parking</SelectItem>
                  <SelectItem value="false">Sin parking</SelectItem>
                </SelectContent>
              </Select>

              <Select value={hasWifi} onValueChange={setHasWifi}>
                <SelectTrigger>
                  <SelectValue placeholder="WiFi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Con WiFi</SelectItem>
                  <SelectItem value="false">Sin WiFi</SelectItem>
                </SelectContent>
              </Select>

              <Select value={hasPool} onValueChange={setHasPool}>
                <SelectTrigger>
                  <SelectValue placeholder="Piscina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Con piscina</SelectItem>
                  <SelectItem value="false">Sin piscina</SelectItem>
                </SelectContent>
              </Select>

              <Select value={hasGym} onValueChange={setHasGym}>
                <SelectTrigger>
                  <SelectValue placeholder="Gimnasio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Con gimnasio</SelectItem>
                  <SelectItem value="false">Sin gimnasio</SelectItem>
                </SelectContent>
              </Select>

              <Select value={hasSecurity} onValueChange={setHasSecurity}>
                <SelectTrigger>
                  <SelectValue placeholder="Seguridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Con seguridad</SelectItem>
                  <SelectItem value="false">Sin seguridad</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <div className="mb-4">
          <p className="text-gray-600">
            {filteredProperties.length} propiedades encontradas
          </p>
        </div>
      </div>

      {/* Grid de propiedades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => {
          const userPlan = getUserFrame(property.subscriptions || []);
          
          return (
            <Card key={property.id} className={`hover:shadow-lg transition-shadow ${getFrameStyle(userPlan)}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold line-clamp-2">
                    {property.title}
                  </CardTitle>
                  {getPlanBadge(userPlan)}
                </div>
                
                {/* Información del usuario para planes premium */}
                {(userPlan === 'plan_300' || userPlan === 'plan_500' || userPlan === 'plan_1000' || userPlan === 'plan_3000') && property.profiles && (
                  <div className="text-sm text-gray-600">
                    <p>📞 {property.profiles.phone || 'No disponible'}</p>
                    <p>👤 {property.profiles.first_name} {property.profiles.last_name}</p>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.city}, {property.province}
                  </div>
                  
                  <div className="flex items-center text-2xl font-bold text-blue-600">
                    <DollarSign className="h-5 w-5 mr-1" />
                    {formatPrice(property.price, property.currency)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {property.bedrooms && (
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        {property.bedrooms}
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1" />
                        {property.bathrooms}
                      </div>
                    )}
                    {property.parking_spaces && property.parking_spaces > 0 && (
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-1" />
                        {property.parking_spaces}
                      </div>
                    )}
                  </div>
                  
                  {/* Características */}
                  <div className="flex flex-wrap gap-1">
                    {property.features?.includes('pets') && <Dog className="h-4 w-4 text-green-600" />}
                    {property.features?.includes('wifi') && <Wifi className="h-4 w-4 text-blue-600" />}
                    {property.features?.includes('security') && <Shield className="h-4 w-4 text-red-600" />}
                    {property.features?.includes('pool') && <Waves className="h-4 w-4 text-blue-400" />}
                    {property.features?.includes('gym') && <Dumbbell className="h-4 w-4 text-purple-600" />}
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {property.description}
                  </p>
                  
                  <div className="flex justify-between items-center pt-2">
                    <Badge variant={property.operation_type === 'sale' ? 'default' : 'secondary'}>
                      {property.operation_type === 'sale' ? 'Venta' : 'Alquiler'}
                    </Badge>
                    
                    <div className="text-xs text-gray-500">
                      {property.views_count} vistas
                    </div>
                  </div>
                  
                  {/* Enlaces para usuarios VIP */}
                  {userPlan === 'plan_3000' && (
                    <div className="pt-2 border-t">
                      <Link 
                        to={`/user/${property.profiles?.first_name?.toLowerCase()}-${property.profiles?.last_name?.toLowerCase()}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver todas las propiedades de {property.profiles?.first_name}
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProperties.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron propiedades
          </h3>
          <p className="text-gray-600 mb-4">
            Intenta ajustar tus filtros de búsqueda
          </p>
          <Button onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
};

export default Properties;
