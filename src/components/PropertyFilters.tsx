
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";

interface Props {
  filters: {
    searchTerm: string;
    operationType: string;
    state: string;
    municipality: string;
    minPrice: string;
    maxPrice: string;
  };
  mexicoStates: string[];
  municipalities: string[];
  setFilter: (name: string, value: string) => void;
  clearFilters: () => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  propertiesCount: number;
}

const PropertyFilters: React.FC<Props> = ({
  filters,
  mexicoStates,
  municipalities,
  setFilter,
  clearFilters,
  showFilters,
  setShowFilters,
  propertiesCount,
}) => (
  <div>
    {/* Botón para móvil */}
    <div className="md:hidden mb-4">
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className="w-full flex items-center justify-center gap-2"
      >
        <Filter className="h-4 w-4" />
        {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
      </Button>
    </div>
    {/* Filtros */}
    <div className={`space-y-4 mb-6 ${showFilters ? "block" : "hidden md:block"}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <Input
            type="text"
            placeholder="Buscar por título, ciudad o dirección..."
            value={filters.searchTerm}
            onChange={e => setFilter("searchTerm", e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filters.operationType} onValueChange={value => setFilter("operationType", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de operación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sale">Venta</SelectItem>
            <SelectItem value="rent">Alquiler</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.state} onValueChange={value => setFilter("state", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Estados</SelectItem>
            {mexicoStates.map(estado => (
              <SelectItem key={estado} value={estado}>{estado}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder="Precio mínimo"
          value={filters.minPrice}
          onChange={e => setFilter("minPrice", e.target.value)}
        />
        <Input
          type="number"
          placeholder="Precio máximo"
          value={filters.maxPrice}
          onChange={e => setFilter("maxPrice", e.target.value)}
        />
      </div>
      {filters.state && filters.state !== "all" && municipalities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={filters.municipality} onValueChange={value => setFilter("municipality", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Municipio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Municipios</SelectItem>
              {municipalities.map(mun => (
                <SelectItem key={mun} value={mun}>{mun}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-2">
          <X className="h-3 w-3" />
          Limpiar filtros
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {propertiesCount} propiedades encontradas
        </span>
      </div>
    </div>
  </div>
);
export default PropertyFilters;
