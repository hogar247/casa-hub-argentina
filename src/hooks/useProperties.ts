
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
  console.log("useProperties: Hook initialized"); // Log
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
    console.log("useProperties: fetchProperties started. Current loading state:", loading); // Log
    setLoading(true); // Ensure it's true before fetch
    try {
      console.log("useProperties: Attempting to fetch properties from Supabase..."); // Log
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

      console.log("useProperties: Supabase fetch completed. Error:", error, "Data:", data ? `Received ${data.length} items` : "No data"); // Log

      if (error) {
        console.error("useProperties: Error fetching properties:", error); // Log
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
      console.log("useProperties: Properties mapped:", mapped.length, "items. Current loading state before setProperties:", loading); // Log
      setProperties(mapped);
    } catch (error) {
      console.error("useProperties: Catch block error during fetchProperties:", error); // Log
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar los inmuebles.",
        variant: "destructive",
      });
      setProperties([]);
    } finally {
      console.log("useProperties: fetchProperties finally block. Setting loading to false. Current loading state:", loading); // Log
      setLoading(false);
      console.log("useProperties: fetchProperties finally block. Loading state AFTER setLoading(false)."); // Log
    }
  };

  useEffect(() => {
    console.log("useProperties: useEffect[] triggered. Calling fetchProperties."); // Log
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // console.log("useProperties: filteredProperties calculated:", filteredProperties.length, "items. Current loading state:", loading); // Log (optional, can be noisy)


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

  console.log("useProperties: Hook returning. Loading state:", loading, "Filtered properties count:", filteredProperties.length); // Log
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

