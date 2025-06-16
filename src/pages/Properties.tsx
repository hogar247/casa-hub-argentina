
import React, { useState } from "react";
import PropertyDetailsModal from "@/components/PropertyDetailsModal";
import { useProperties } from "@/hooks/useProperties";
import PropertyFilters from "@/components/PropertyFilters";
import PropertiesGrid from "@/components/PropertiesGrid";

const Properties = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<ReturnType<typeof useProperties>["filteredProperties"][number] | null>(null);

  const {
    filteredProperties,
    loading,
    filters,
    setFilter,
    clearFilters,
    mexicoStates,
    municipalities,
  } = useProperties();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                Cargando propiedades...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Propiedades Disponibles en México
          </h1>
          <PropertyFilters
            filters={filters}
            mexicoStates={mexicoStates}
            municipalities={municipalities}
            setFilter={setFilter}
            clearFilters={clearFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            propertiesCount={filteredProperties.length}
          />
        </div>
        <PropertiesGrid
          properties={filteredProperties}
          onSelect={setSelectedProperty}
        />
        {selectedProperty && (
          <PropertyDetailsModal
            property={selectedProperty}
            isOpen={!!selectedProperty}
            onClose={() => setSelectedProperty(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Properties;
