
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Home, MapPin } from 'lucide-react';
import { MEXICO_STATES_MUNICIPALITIES } from '@/data/mexicoStates';

interface Property {
  title: string;
  description: string;
  price: number;
  currency: string;
  operation_type: string;
  status: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  bedrooms: number;
  bathrooms: number;
  surface_total: number;
  surface_covered: number;
  parking_spaces: number;
  floor_number?: number;
  total_floors?: number;
  features: string[];
  amenities: string[];
  is_featured: boolean;
}

interface PropertyFormFieldsProps {
  property: Property;
  setProperty: React.Dispatch<React.SetStateAction<Property>>;
  municipalities: string[];
  onStateChange: (state: string) => void;
}

const COMMON_FEATURES = [
  'Aire acondicionado', 'Calefacción', 'Balcón', 'Terraza', 'Jardín',
  'Piscina', 'Gimnasio', 'Seguridad 24h', 'Amueblado', 'Cocina equipada'
];

const COMMON_AMENITIES = [
  'Ascensor', 'Portero', 'Lavandería', 'Estacionamiento', 'Depósito',
  'Parrilla', 'Quincho', 'Sum', 'Sala de juegos', 'Cancha de tenis'
];

const PropertyFormFields: React.FC<PropertyFormFieldsProps> = ({
  property,
  setProperty,
  municipalities,
  onStateChange
}) => {
  const handleFeatureChange = (feature: string, checked: boolean) => {
    setProperty(prev => ({
      ...prev,
      features: checked 
        ? [...prev.features, feature]
        : prev.features.filter(f => f !== feature)
    }));
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setProperty(prev => ({
      ...prev,
      amenities: checked 
        ? [...prev.amenities, amenity]
        : prev.amenities.filter(a => a !== amenity)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título de la propiedad</Label>
            <Input
              id="title"
              value={property.title}
              onChange={(e) => setProperty(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Hermoso departamento en el centro"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={property.description}
              onChange={(e) => setProperty(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe las características principales de la propiedad..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="operation_type">Tipo de operación</Label>
              <Select 
                value={property.operation_type} 
                onValueChange={(value) => setProperty(prev => ({ ...prev, operation_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Venta</SelectItem>
                  <SelectItem value="rent">Alquiler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                value={property.price}
                onChange={(e) => setProperty(prev => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="currency">Moneda</Label>
              <Select 
                value={property.currency} 
                onValueChange={(value) => setProperty(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN (Peso Mexicano)</SelectItem>
                  <SelectItem value="USD">USD (Dólar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={property.address}
              onChange={(e) => setProperty(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Calle y número"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="province">Estado</Label>
              <Select 
                value={property.province} 
                onValueChange={onStateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(MEXICO_STATES_MUNICIPALITIES).map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city">Municipio</Label>
              <Select 
                value={property.city} 
                onValueChange={(value) => setProperty(prev => ({ ...prev, city: value }))}
                disabled={!property.province}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un municipio" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((municipality) => (
                    <SelectItem key={municipality} value={municipality}>
                      {municipality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="postal_code">Código Postal</Label>
              <Input
                id="postal_code"
                value={property.postal_code}
                onChange={(e) => setProperty(prev => ({ ...prev, postal_code: e.target.value }))}
                placeholder="12345"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Propiedad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="bedrooms">Habitaciones</Label>
              <Input
                id="bedrooms"
                type="number"
                min="0"
                value={property.bedrooms}
                onChange={(e) => setProperty(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="bathrooms">Baños</Label>
              <Input
                id="bathrooms"
                type="number"
                min="0"
                value={property.bathrooms}
                onChange={(e) => setProperty(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="surface_total">Superficie Total (m²)</Label>
              <Input
                id="surface_total"
                type="number"
                min="0"
                value={property.surface_total}
                onChange={(e) => setProperty(prev => ({ ...prev, surface_total: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="parking_spaces">Estacionamientos</Label>
              <Input
                id="parking_spaces"
                type="number"
                min="0"
                value={property.parking_spaces}
                onChange={(e) => setProperty(prev => ({ ...prev, parking_spaces: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="surface_covered">Superficie Cubierta (m²)</Label>
              <Input
                id="surface_covered"
                type="number"
                min="0"
                value={property.surface_covered}
                onChange={(e) => setProperty(prev => ({ ...prev, surface_covered: Number(e.target.value) }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="floor_number">Piso</Label>
                <Input
                  id="floor_number"
                  type="number"
                  min="0"
                  value={property.floor_number || ''}
                  onChange={(e) => setProperty(prev => ({ ...prev, floor_number: Number(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="total_floors">Total Pisos</Label>
                <Input
                  id="total_floors"
                  type="number"
                  min="1"
                  value={property.total_floors || ''}
                  onChange={(e) => setProperty(prev => ({ ...prev, total_floors: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features and Amenities */}
      <Card>
        <CardHeader>
          <CardTitle>Características y Amenities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium">Características</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {COMMON_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={`feature-${feature}`}
                    checked={property.features.includes(feature)}
                    onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                  />
                  <Label htmlFor={`feature-${feature}`} className="text-sm">
                    {feature}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Amenities</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {COMMON_AMENITIES.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity}`}
                    checked={property.amenities.includes(amenity)}
                    onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                  />
                  <Label htmlFor={`amenity-${amenity}`} className="text-sm">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyFormFields;
