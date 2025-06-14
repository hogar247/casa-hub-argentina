
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Car } from "lucide-react";
import { Property } from "@/hooks/useProperties";

interface Props {
  properties: Property[];
  onSelect: (property: Property) => void;
}

function formatPrice(price: number, currency: string = "MXN") {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function getMainImage(images: { image_url: string; is_main: boolean }[]) {
  const mainImage = images?.find((img) => img.is_main);
  return mainImage?.image_url || images?.[0]?.image_url || "/placeholder.svg";
}

const PropertiesGrid: React.FC<Props> = ({ properties, onSelect }) => {
  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          No se encontraron propiedades que coincidan con los filtros aplicados.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <Card
          key={property.id}
          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700"
          onClick={() => onSelect(property)}
        >
          <div className="relative">
            <img
              src={getMainImage(property.property_images)}
              alt={property.title}
              className="w-full h-48 object-cover"
              onError={e => {
                (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            {property.is_featured && (
              <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                ⭐ Destacado
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="absolute top-2 left-2 bg-blue-600 text-white"
            >
              {property.operation_type === "sale" ? "Venta" : "Alquiler"}
            </Badge>
          </div>

          <CardHeader className="pb-2">
            <CardTitle className="text-lg line-clamp-2 dark:text-white">
              {property.title}
            </CardTitle>
            <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              {property.city}, {property.province}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatPrice(property.price, property.currency)}
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-1" />
                {property.bedrooms || 0}
              </div>
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-1" />
                {property.bathrooms || 0}
              </div>
              <div className="flex items-center">
                <Car className="h-4 w-4 mr-1" />
                {property.parking_spaces || 0}
              </div>
            </div>
            {property.surface_total && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Superficie: {property.surface_total} m²
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Publicado por:{" "}
              {property.profiles?.company_name ||
                `${property.profiles?.first_name || ""} ${property.profiles?.last_name || ""}`.trim() ||
                "Usuario"}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PropertiesGrid;
