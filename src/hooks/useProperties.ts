
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MEXICO_STATES_MUNICIPALITIES } from "@/data/mexicoStates";

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  operation_type: string;
  address: string;
  city: string;
  province: string;
  bedrooms: number;
  bathrooms: number;
  parking_spaces: number;
  surface_total: number;
  surface_covered: number;
  is_featured: boolean;
  status: string;
  views_count: number;
  created_at: string;
  features: any[];
  amenities: any[];
  user_id: string;
  subscriptions: any;
  property_images: { image_url: string; is_main: boolean }[];
  profiles: {
    first_name: string;
    last_name: string;
    company_name: string;
    phone: string;
    email: string;
    user_type: string;
  };
}

interface Filters {
  searchTerm: string;
  operationType: string;
  state: string;
  municipality: string;
  minPrice: string;
  maxPrice: string;
}

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    searchTerm: "",
    operationType: "",
    state: "",
    municipality: "",
    minPrice: "",
    maxPrice: "",
  });
  const { toast } = useToast();

  const mexicoStates = Object.keys(MEXICO_STATES_MUNICIPALITIES);
  const municipalities =
    filters.state && filters.state !== "all"
      ? MEXICO_STATES_MUNICIPALITIES[filters.state] || []
      : [];

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(
          `
          *,
          property_images (image_url, is_main),
          profiles (first_name, last_name, company_name, phone, email, user_type)
        `
        )
        .eq("status", "published")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las propiedades",
          variant: "destructive",
        });
        setProperties([]);
        return;
      }

      const mapped: Property[] = (data || []).map((property) => ({
        id: property.id,
        title: property.title || "",
        description: property.description || "",
        price: Number(property.price) || 0,
        currency: property.currency || "MXN",
        operation_type: property.operation_type || "",
        address: property.address || "",
        city: property.city || "",
        province: property.province || "",
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        parking_spaces: property.parking_spaces || 0,
        surface_total: property.surface_total || 0,
        surface_covered: property.surface_covered || 0,
        is_featured: property.is_featured || false,
        status: property.status || "draft",
        views_count: property.views_count || 0,
        created_at: property.created_at || "",
        features: Array.isArray(property.features) ? property.features : [],
        amenities: Array.isArray(property.amenities) ? property.amenities : [],
        user_id: property.user_id || "",
        subscriptions: null,
        property_images: Array.isArray(property.property_images)
          ? property.property_images
          : [],
        profiles:
          property.profiles || {
            first_name: "",
            last_name: "",
            company_name: "",
            phone: "",
            email: "",
            user_type: "owner",
          },
      }));

      setProperties(mapped);
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar los inmuebles.",
        variant: "destructive",
      });
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line
  }, []);

  // Función para filtrar propiedades según los filtros seleccionados
  const filteredProperties = properties.filter((property) => {
    const { searchTerm, operationType, state, municipality, minPrice, maxPrice } = filters;
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOperation =
      !operationType || operationType === "all" || property.operation_type === operationType;
    const matchesState =
      !state || state === "all" || property.province === state;
    const matchesMunicipality =
      !municipality || municipality === "all" || property.city === municipality;
    const matchesMinPrice = !minPrice || property.price >= parseInt(minPrice);
    const matchesMaxPrice = !maxPrice || property.price <= parseInt(maxPrice);

    return (
      matchesSearch &&
      matchesOperation &&
      matchesState &&
      matchesMunicipality &&
      matchesMinPrice &&
      matchesMaxPrice
    );
  });

  const setFilter = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    // Si el estado cambia, resetea municipio
    if (name === "state") setFilters((prev) => ({ ...prev, municipality: "" }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      operationType: "",
      state: "",
      municipality: "",
      minPrice: "",
      maxPrice: "",
    });
  };

  return {
    properties,
    filteredProperties,
    loading,
    filters,
    setFilter,
    clearFilters,
    mexicoStates,
    municipalities,
  };
}
