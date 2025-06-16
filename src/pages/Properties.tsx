
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Building, Heart, Share2, Eye, Bed, Bath, Car, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  operation_type: string;
  status: string;
  city: string;
  province: string;
  bedrooms: number;
  bathrooms: number;
  surface_total: number;
  parking_spaces: number;
  views_count: number;
  created_at: string;
  description: string;
  features: string[];
  amenities: string[];
  is_featured: boolean;
  user_id: string;
  property_images: Array<{ image_url: string; is_main: boolean }>;
  profiles: {
    first_name: string;
    last_name: string;
    company_name: string;
    phone: string;
    user_type: string;
    youtube_url?: string;
    instagram_url?: string;
    facebook_url?: string;
  };
  subscriptions: Array<{
    plan_type: string;
    status: string;
  }>;
}

const MEXICO_STATES_MUNICIPALITIES = {
  "Aguascalientes": ["Aguascalientes","Asientos","Calvillo","Cosio","El Llano","Jesus Maria","Pabellon de Arteaga","Rincon de Romos","San Francisco de los Romo","San Jose de Gracia","Tepezala"],
  "Baja California": ["Ensenada","Mexicali","Playas de Rosarito","Tecate","Tijuana"],
  "Baja California Sur": ["Comondu","La Paz","Loreto","Los Cabos","Mulege"],
  "Campeche": ["Calakmul","Calkini","Campeche","Candelaria","Carmen","Champoton","Escarcega","Hecelchakan","Hopelchen","Palizada","Tenabo"],
  "Coahuila": ["Abasolo","Acuna","Allende","Arteaga","Candela","Castanos","Cuatro Cienegas","Escobedo","Francisco I. Madero","Frontera","General Cepeda","Guerrero","Hidalgo","Jimenez","Juarez","Lamadrid","Matamoros","Monclova","Morelos","Muzquiz","Nadadores","Nava","Ocampo","Parras","Piedras Negras","Progreso","Ramos Arizpe","Sabinas","Sacramento","Saltillo","San Buenaventura","San Juan de Sabinas","San Pedro","Sierra Mojada","Torreon","Viesca","Villa Union","Zaragoza"],
  "Colima": ["Armeria","Colima","Comala","Coquimatlan","Cuauhtemoc","Ixtlahuacan","Manzanillo","Minatitlan","Tecoman","Villa de Alvarez"],
  "Chiapas": ["Acacoyagua","Acala","Acapetahua","Aldama","Altamirano","Amatenango de la Frontera","Amatenango del Valle","Amatan","Angel Albino Corzo","Arriaga","Bejucal de Ocampo","Bella Vista","Benemerito de las Americas","Berriozabal","Bochil","Cacahoatan","Capitan Luis Angel Vidal","Catazaja","Chalchihuitan","Chamula","Chanal","Chapultenango","Chenalho","Chiapa de Corzo","Chiapilla","Chicoasen","Chicomuselo","Chilon","Cintalapa","Coapilla","Comitan de Dominguez","Copainala","El Bosque","El Parral","El Porvenir","Emiliano Zapata","Escuintla","Francisco Leon","Frontera Comalapa","Frontera Hidalgo","Huehuetan","Huitiupan","Huixtla","Huixtan","Ixhuatan","Ixtacomitan","Ixtapa","Ixtapangajoya","Jiquipilas","Jitotol","Juarez","La Concordia","La Grandeza","La Independencia","La Libertad","La Trinitaria","Larrainzar","Las Margaritas","Las Rosas","Mapastepec","Maravilla Tenejapa","Marques de Comillas","Mazapa de Madero","Mazatan","Metapa","Mezcalapa","Mitontic","Montecristo de Guerrero","Motozintla","Nicolas Ruiz","Ocosingo","Ocotepec","Ocozocoautla de Espinosa","Ostuacan","Osumacinta","Oxchuc","Palenque","Pantelho","Pantepec","Pichucalco","Pijijiapan","Pueblo Nuevo Solistahuacan","Rayon","Reforma","Rincon Chamula San Pedro","Sabanilla","Salto de Agua","San Andres Duraznal","San Cristobal de las Casas","San Fernando","San Juan Cancuc","San Lucas","Santiago el Pinar","Siltepec","Simojovel","Sitala","Socoltenango","Solosuchiapa","Soyalo","Suchiapa","Suchiate","Sunuapa","Tapachula","Tapalapa","Tapilula","Tecpatan","Tenejapa","Teopisca","Tila","Tonala","Totolapa","Tumbala","Tuxtla Chico","Tuxtla Gutierrez","Tuzantan","Tzimol","Union Juarez","Venustiano Carranza","Villa Comaltitlan","Villa Corzo","Villaflores","Yajalon","Zinacantan"],
  "Chihuahua": ["Ahumada","Aldama","Allende","Aquiles Serdan","Ascension","Bachiniva","Balleza","Batopilas de Manuel Gomez Morin","Bocoyna","Buenaventura","Camargo","Carichi","Casas Grandes","Chihuahua","Chinipas","Coronado","Coyame del Sotol","Cuauhtemoc","Cusihuiriachi","Delicias","Dr. Belisario Dominguez","El Tule","Galeana","Gran Morelos","Guachochi","Guadalupe y Calvo","Guadalupe","Guazapares","Guerrero","Gomez Farias","Hidalgo del Parral","Huejotitan","Ignacio Zaragoza","Janos","Jimenez","Julimes","Juarez","La Cruz","Lopez","Madera","Maguarichi","Manuel Benavides","Matachi","Matamoros","Meoqui","Morelos","Moris","Namiquipa","Nonoava","Nuevo Casas Grandes","Ocampo","Ojinaga","Praxedis G. Guerrero","Riva Palacio","Rosales","Rosario","San Francisco de Borja","San Francisco de Conchos","San Francisco del Oro","Santa Barbara","Santa Isabel","Satevo","Saucillo","Temosachic","Urique","Uruachi","Valle de Zaragoza"],
  "Ciudad de Mexico": ["Alvaro Obregon","Azcapotzalco","Benito Juarez","Coyoacan","Cuajimalpa de Morelos","Cuauhtemoc","Gustavo A. Madero","Iztacalco","Iztapalapa","La Magdalena Contreras","Miguel Hidalgo","Milpa Alta","Tlalpan","Tlahuac","Venustiano Carranza","Xochimilco"],
  "Durango": ["Canatlan","Canelas","Coneto de Comonfort","Cuencame","Durango","El Oro","General Simon Bolivar","Gomez Palacio","Guadalupe Victoria","Guanacevi","Hidalgo","Inde","Lerdo","Mapimi","Mezquital","Nazas","Nombre de Dios","Nuevo Ideal","Ocampo","Otaez","Panuco de Coronado","Penon Blanco","Poanas","Pueblo Nuevo","Rodeo","San Bernardo","San Dimas","San Juan de Guadalupe","San Juan del Rio","San Luis del Cordero","San Pedro del Gallo","Santa Clara","Santiago Papasquiaro","Suchil","Tamazula","Tepehuanes","Tlahualilo","Topia","Vicente Guerrero"],
  "Guanajuato": ["Abasolo","Acambaro","Apaseo el Alto","Apaseo el Grande","Atarjea","Celaya","Comonfort","Coroneo","Cortazar","Cueramaro","Doctor Mora","Dolores Hidalgo Cuna de la Independencia Nacional","Guanajuato","Huanimaro","Irapuato","Jaral del Progreso","Jerecuaro","Leon","Manuel Doblado","Moroleon","Ocampo","Penjamo","Pueblo Nuevo","Purisima del Rincon","Romita","Salamanca","Salvatierra","San Diego de la Union","San Felipe","San Francisco del Rincon","San Jose Iturbide","San Luis de la Paz","San Miguel de Allende","Santa Catarina","Santa Cruz de Juventino Rosas","Santiago Maravatio","Silao de la Victoria","Tarandacuao","Tarimoro","Tierra Blanca","Uriangato","Valle de Santiago","Victoria","Villagran","Xichu","Yuriria"],
  "Guerrero": ["Acapulco de Juarez","Acatepec","Ahuacuotzingo","Ajuchitlan del Progreso","Alcozauca de Guerrero","Alpoyeca","Apaxtla","Arcelia","Atenango del Rio","Atlamajalcingo del Monte","Atlixtac","Atoyac de Alvarez","Ayutla de los Libres","Azoyu","Benito Juarez","Buenavista de Cuellar","Chilapa de Alvarez","Chilpancingo de los Bravo","Coahuayutla de Jose Maria Izazaga","Cochoapa el Grande","Cocula","Copala","Copalillo","Copanatoyac","Coyuca de Benitez","Coyuca de Catalan","Cuajinicuilapa","Cualac","Cuautepec","Cuetzala del Progreso","Cutzamala de Pinzon","Eduardo Neri","Florencio Villarreal","General Canuto A. Neri","General Heliodoro Castillo","Huamuxtitlan","Huitzuco de los Figueroa","Iguala de la Independencia","Igualapa","Iliatenco","Ixcateopan de Cuauhtemoc","Jose Joaquin de Herrera","Juan R. Escudero","Juchitan","La Union de Isidoro Montes de Oca","Leonardo Bravo","Malinaltepec","Marquelia","Martir de Cuilapan","Metlatonoc","Mochitlan","Olinala","Ometepec","Pedro Ascencio Alquisiras","Petatlan","Pilcaya","Pungarabato","Quechultenango","San Luis Acatlan","San Marcos","San Miguel Totolapan","Taxco de Alarcon","Tecoanapa","Tecpan de Galeana","Teloloapan","Tepecoacuilco de Trujano","Tetipac","Tixtla de Guerrero","Tlacoachistlahuaca","Tlacoapa","Tlalchapa","Tlalixtaquilla de Maldonado","Tlapa de Comonfort","Tlapehuala","Xalpatlahuac","Xochihuehuetlan","Xochistlahuaca","Zapotitlan Tablas","Zihuatanejo de Azueta","Zirandaro","Zitlala"],
  "Hidalgo": ["Acatlan","Acaxochitlan","Actopan","Agua Blanca de Iturbide","Ajacuba","Alfajayucan","Almoloya","Apan","Atitalaquia","Atlapexco","Atotonilco de Tula","Atotonilco el Grande","Calnali","Cardonal","Chapantongo","Chapulhuacan","Chilcuautla","Cuautepec de Hinojosa","El Arenal","Eloxochitlan","Emiliano Zapata","Epazoyucan","Francisco I. Madero","Huasca de Ocampo","Huautla","Huazalingo","Huehuetla","Huejutla de Reyes","Huichapan","Ixmiquilpan","Jacala de Ledezma","Jaltocan","Juarez Hidalgo","La Mision","Lolotla","Metepec","Metztitlan","Mineral de la Reforma","Mineral del Chico","Mineral del Monte","Mixquiahuala de Juarez","Molango de Escamilla","Nicolas Flores","Nopala de Villagran","Omitlan de Juarez","Pachuca de Soto","Pacula","Pisaflores","Progreso de Obregon","San Agustin Metzquititlan","San Agustin Tlaxiaca","San Bartolo Tutotepec","San Felipe Orizatlan","San Salvador","Santiago Tulantepec de Lugo Guerrero","Santiago de Anaya","Singuilucan","Tasquillo","Tecozautla","Tenango de Doria","Tepeapulco","Tepehuacan de Guerrero","Tepeji del Rio de Ocampo","Tepetitlan","Tetepango","Tezontepec de Aldama","Tianguistengo","Tizayuca","Tlahuelilpan","Tlahuiltepa","Tlanalapa","Tlanchinol","Tlaxcoapan","Tolcayuca","Tula de Allende","Tulancingo de Bravo","Villa de Tezontepec","Xochiatipan","Xochicoatlan","Yahualica","Zacualtipan de Angeles","Zapotlan de Juarez","Zempoala","Zimapan"],
  "Jalisco": ["Acatic","Acatlan de Juarez","Ahualulco de Mercado","Amacueca","Amatitan","Ameca","Arandas","Atemajac de Brizuela","Atengo","Atenguillo","Atotonilco el Alto","Atoyac","Autlan de Navarro","Ayotlan","Ayutla","Bolanos","Cabo Corrientes","Canadas de Obregon","Casimiro Castillo","Chapala","Chimaltitan","Chiquilistlan","Cihuatlan","Cocula","Colotlan","Concepcion de Buenos Aires","Cuautitlan de Garcia Barragan","Cuautla","Cuquio","Degollado","Ejutla","El Arenal","El Grullo","El Limon","El Salto","Encarnacion de Diaz","Etzatlan","Gomez Farias","Guachinango","Guadalajara","Hostotipaquillo","Huejucar","Huejuquilla el Alto","Ixtlahuacan de los Membrillos","Ixtlahuacan del Rio","Jalostotitlan","Jamay","Jesus Maria","Jilotlan de los Dolores","Jocotepec","Juanacatlan","Juchitlan","La Barca","La Huerta","La Manzanilla de la Paz","Lagos de Moreno","Magdalena","Mascota","Mazamitla","Mexticacan","Mezquitic","Mixtlan","Ocotlan","Ojuelos de Jalisco","Pihuamo","Poncitlan","Puerto Vallarta","Quitupan","San Cristobal de la Barranca","San Diego de Alejandria","San Gabriel","San Ignacio Cerro Gordo","San Juan de los Lagos","San Juanito de Escobedo","San Julian","San Marcos","San Martin Hidalgo","San Martin de Bolanos","San Miguel el Alto","San Pedro Tlaquepaque","San Sebastian del Oeste","Santa Maria de los Angeles","Santa Maria del Oro","Sayula","Tala","Talpa de Allende","Tamazula de Gordiano","Tapalpa","Tecalitlan","Techaluta de Montenegro","Tecolotlan","Tenamaxtlan","Teocaltiche","Teocuitatlan de Corona","Tepatitlan de Morelos","Tequila","Teuchitlan","Tizapan el Alto","Tlajomulco de Zuniga","Toliman","Tomatlan","Tonala","Tonaya","Tonila","Totatiche","Tototlan","Tuxcacuesco","Tuxcueca","Tuxpan","Union de San Antonio","Union de Tula","Valle de Guadalupe","Valle de Juarez","Villa Corona","Villa Guerrero","Villa Hidalgo","Villa Purificacion","Yahualica de Gonzalez Gallo","Zacoalco de Torres","Zapopan","Zapotiltic","Zapotitlan de Vadillo","Zapotlan del Rey","Zapotlan el Grande","Zapotlanejo"],
  "Estado de Mexico": ["Acambay de Ruiz Castaneda","Acolman","Aculco","Almoloya de Alquisiras","Almoloya de Juarez","Almoloya del Rio","Amanalco","Amatepec","Amecameca","Apaxco","Atenco","Atizapan de Zaragoza","Atizapan","Atlacomulco","Atlautla","Axapusco","Ayapango","Calimaya","Capulhuac","Chalco","Chapa de Mota","Chapultepec","Chiautla","Chicoloapan","Chiconcuac","Chimalhuacan","Coacalco de Berriozabal","Coatepec Harinas","Cocotitlan","Coyotepec","Cuautitlan Izcalli","Cuautitlan","Donato Guerra","Ecatepec de Morelos","Ecatzingo","El Oro","Huehuetoca","Hueypoxtla","Huixquilucan","Isidro Fabela","Ixtapaluca","Ixtapan de la Sal","Ixtapan del Oro","Ixtlahuaca","Jaltenco","Jilotepec","Jilotzingo","Jiquipilco","Jocotitlan","Joquicingo","Juchitepec","La Paz","Lerma","Luvianos","Malinalco","Melchor Ocampo","Metepec","Mexicaltzingo","Morelos","Naucalpan de Juarez","Nextlalpan","Nezahualcoyotl","Nicolas Romero","Nopaltepec","Ocoyoacac","Ocuilan","Otumba","Otzoloapan","Otzolotepec","Ozumba","Papalotla","Polotitlan","Rayon","San Antonio la Isla","San Felipe del Progreso","San Jose del Rincon","San Martin de las Piramides","San Mateo Atenco","San Simon de Guerrero","Santo Tomas","Soyaniquilpan de Juarez","Sultepec","Tecamac","Tejupilco","Temamatla","Temascalapa","Temascalcingo","Temascaltepec","Temoaya","Tenancingo","Tenango del Aire","Tenango del Valle","Teoloyucan","Teotihuacan","Tepetlaoxtoc","Tepetlixpa","Tepotzotlan","Tequixquiac","Texcaltitlan","Texcalyacac","Texcoco","Tezoyuca","Tianguistenco","Timilpan","Tlalmanalco","Tlalnepantla de Baz","Tlatlaya","Toluca","Tonanitla","Tonatico","Tultepec","Tultitlan","Valle de Bravo","Valle de Chalco Solidaridad","Villa Guerrero","Villa Victoria","Villa de Allende","Villa del Carbon","Xalatlaco","Xonacatlan","Zacazonapan","Zacualpan","Zinacantepec","Zumpahuacan","Zumpango"]
};

const PropertiesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    operationType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    state: '',
    city: '',
    petFriendly: '',
    furnished: '',
    parking: '',
    wifi: '',
    pool: '',
    gym: '',
    security: '',
    elevator: ''
  });

  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);

  useEffect(() => {
    if (filters.state && MEXICO_STATES_MUNICIPALITIES[filters.state as keyof typeof MEXICO_STATES_MUNICIPALITIES]) {
      setSelectedMunicipalities(MEXICO_STATES_MUNICIPALITIES[filters.state as keyof typeof MEXICO_STATES_MUNICIPALITIES]);
    } else {
      setSelectedMunicipalities([]);
    }
  }, [filters.state]);

  useEffect(() => {
    fetchProperties();
    if (user) {
      fetchFavorites();
    }
  }, [searchQuery, filters, user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', user.id);
    
    if (data) {
      setFavorites(data.map(fav => fav.property_id));
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para guardar favoritos",
        variant: "destructive",
      });
      return;
    }

    const isFavorite = favorites.includes(propertyId);
    
    if (isFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);
      
      if (!error) {
        setFavorites(prev => prev.filter(id => id !== propertyId));
        toast({
          title: "Eliminado de favoritos",
          description: "La propiedad ha sido eliminada de tus favoritos",
        });
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: user.id, property_id: propertyId }]);
      
      if (!error) {
        setFavorites(prev => [...prev, propertyId]);
        toast({
          title: "Agregado a favoritos",
          description: "La propiedad ha sido agregada a tus favoritos",
        });
      }
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_images (image_url, is_main),
        profiles (first_name, last_name, company_name, phone, user_type, youtube_url, instagram_url, facebook_url),
        subscriptions!inner (plan_type, status)
      `)
      .eq('status', 'published')
      .eq('subscriptions.status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,province.ilike.%${searchQuery}%`);
    }

    if (filters.operationType) {
      query = query.eq('operation_type', filters.operationType);
    }

    if (filters.minPrice) {
      query = query.gte('price', parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      query = query.lte('price', parseFloat(filters.maxPrice));
    }

    if (filters.bedrooms) {
      query = query.eq('bedrooms', parseInt(filters.bedrooms));
    }

    if (filters.bathrooms) {
      query = query.eq('bathrooms', parseInt(filters.bathrooms));
    }

    if (filters.state) {
      query = query.eq('province', filters.state);
    }

    if (filters.city) {
      query = query.eq('city', filters.city);
    }

    const { data, error } = await query;

    if (data && !error) {
      // Apply feature filters
      let filteredData = data.filter((property: any) => {
        const features = Array.isArray(property.features) ? property.features : 
                        (typeof property.features === 'string' ? JSON.parse(property.features || '[]') : []);
        const amenities = Array.isArray(property.amenities) ? property.amenities : 
                         (typeof property.amenities === 'string' ? JSON.parse(property.amenities || '[]') : []);
        
        const allFeatures = [...features, ...amenities];

        if (filters.petFriendly && !allFeatures.includes('Acepta mascotas')) return false;
        if (filters.furnished && !allFeatures.includes('Amueblado')) return false;
        if (filters.parking && property.parking_spaces <= 0) return false;
        if (filters.wifi && !allFeatures.includes('WiFi')) return false;
        if (filters.pool && !allFeatures.includes('Piscina')) return false;
        if (filters.gym && !allFeatures.includes('Gimnasio')) return false;
        if (filters.security && !allFeatures.includes('Seguridad 24h')) return false;
        if (filters.elevator && !allFeatures.includes('Elevador')) return false;

        return true;
      });

      setProperties(filteredData);
    }
    
    setLoading(false);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'MXN',
    }).format(price);
  };

  const getPropertyFrame = (subscriptions: any[]) => {
    const activeSub = subscriptions?.find(sub => sub.status === 'active');
    if (!activeSub) return '';

    switch (activeSub.plan_type) {
      case 'plan_1000':
        return 'border-4 border-yellow-500 shadow-lg shadow-yellow-500/50';
      case 'plan_3000':
        return 'border-4 border-gradient-to-r from-red-500 via-yellow-500 to-red-500 shadow-xl shadow-red-500/50 animate-pulse';
      default:
        return '';
    }
  };

  const getUserBadge = (subscriptions: any[]) => {
    const activeSub = subscriptions?.find(sub => sub.status === 'active');
    if (!activeSub) return null;

    switch (activeSub.plan_type) {
      case 'plan_1000':
        return <Badge className="bg-yellow-500 text-white">Premium</Badge>;
      case 'plan_3000':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse">VIP</Badge>;
      default:
        return null;
    }
  };

  const handleShare = async (property: Property) => {
    const shareData = {
      title: property.title,
      text: `${property.title} - ${formatPrice(property.price, property.currency)}`,
      url: `${window.location.origin}/properties/${property.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert('Enlace copiado al portapapeles');
    }
  };

  const clearFilters = () => {
    setFilters({
      operationType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      state: '',
      city: '',
      petFriendly: '',
      furnished: '',
      parking: '',
      wifi: '',
      pool: '',
      gym: '',
      security: '',
      elevator: ''
    });
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Propiedades Disponibles
        </h1>
        <p className="text-gray-600">
          Encuentra tu propiedad ideal con nuestros filtros avanzados
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar propiedades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select onValueChange={(value) => setFilters({...filters, operationType: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de operación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sale">Venta</SelectItem>
              <SelectItem value="rent">Alquiler</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFilters({...filters, state: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.keys(MEXICO_STATES_MUNICIPALITIES).map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFilters({...filters, city: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Municipio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los municipios</SelectItem>
              {selectedMunicipalities.map((municipality) => (
                <SelectItem key={municipality} value={municipality}>{municipality}</SelectItem>
              ))}
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Input
            type="number"
            placeholder="Precio mínimo"
            value={filters.minPrice}
            onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
          />

          <Input
            type="number"
            placeholder="Precio máximo"
            value={filters.maxPrice}
            onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
          />

          <Select onValueChange={(value) => setFilters({...filters, bedrooms: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Dormitorios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Cualquier cantidad</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFilters({...filters, bathrooms: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Baños" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Cualquier cantidad</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Additional Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-4">
          <Select onValueChange={(value) => setFilters({...filters, petFriendly: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Mascotas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No importa</SelectItem>
              <SelectItem value="yes">Acepta mascotas</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFilters({...filters, furnished: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Amueblado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No importa</SelectItem>
              <SelectItem value="yes">Amueblado</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFilters({...filters, parking: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Parking" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No importa</SelectItem>
              <SelectItem value="yes">Con parking</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFilters({...filters, wifi: value})}>
            <SelectTrigger>
              <SelectValue placeholder="WiFi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No importa</SelectItem>
              <SelectItem value="yes">Con WiFi</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFilters({...filters, pool: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Piscina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No importa</SelectItem>
              <SelectItem value="yes">Con piscina</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFilters({...filters, gym: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Gimnasio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No importa</SelectItem>
              <SelectItem value="yes">Con gimnasio</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFilters({...filters, security: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Seguridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No importa</SelectItem>
              <SelectItem value="yes">Con seguridad</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFilters({...filters, elevator: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Elevador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No importa</SelectItem>
              <SelectItem value="yes">Con elevador</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={clearFilters} variant="outline">
          Limpiar filtros
        </Button>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p>Cargando propiedades...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-8">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron propiedades
          </h3>
          <p className="text-gray-600">
            Intenta ajustar tus filtros de búsqueda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => {
            const mainImage = property.property_images?.find(img => img.is_main)?.image_url 
              || property.property_images?.[0]?.image_url 
              || '/placeholder.svg';

            const activeSub = property.subscriptions?.find(sub => sub.status === 'active');
            const showPhone = activeSub && ['plan_300', 'plan_500', 'plan_1000', 'plan_3000'].includes(activeSub.plan_type);
            const canShare = activeSub && ['plan_1000', 'plan_3000'].includes(activeSub.plan_type);
            const isFavorite = favorites.includes(property.id);

            return (
              <Card 
                key={property.id} 
                className={`overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${getPropertyFrame(property.subscriptions)}`}
              >
                <div className="aspect-video relative">
                  <img 
                    src={mainImage} 
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-blue-600 text-white">
                      {property.operation_type === 'sale' ? 'Venta' : 'Alquiler'}
                    </Badge>
                    {getUserBadge(property.subscriptions)}
                  </div>
                  {property.is_featured && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-yellow-500 text-white">Destacado</Badge>
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(property.id);
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        isFavorite 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/80 hover:bg-white text-gray-700'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    {canShare && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(property);
                        }}
                        className="bg-white/80 hover:bg-white p-2 rounded-full transition-colors"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {property.title}
                  </h3>
                  
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    {formatPrice(property.price, property.currency)}
                  </p>
                  
                  <p className="text-gray-600 mb-4 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.city}, {property.province}
                  </p>

                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      {property.bedrooms} hab.
                    </span>
                    <span className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      {property.bathrooms} baños
                    </span>
                    <span>{property.surface_total} m²</span>
                    {property.parking_spaces > 0 && (
                      <span className="flex items-center">
                        <Car className="h-4 w-4 mr-1" />
                        {property.parking_spaces}
                      </span>
                    )}
                  </div>

                  {/* Agent info */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">
                          {property.profiles?.company_name || 
                           `${property.profiles?.first_name || ''} ${property.profiles?.last_name || ''}`.trim() ||
                           'Propietario'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {property.profiles?.user_type || 'Propietario'}
                        </p>
                        {showPhone && property.profiles?.phone && (
                          <p className="text-xs text-blue-600">
                            📞 {property.profiles.phone}
                          </p>
                        )}
                        {/* Social media links for premium users */}
                        {activeSub && ['plan_1000', 'plan_3000'].includes(activeSub.plan_type) && (
                          <div className="flex gap-2 mt-2">
                            {property.profiles?.youtube_url && (
                              <a href={property.profiles.youtube_url} target="_blank" rel="noopener noreferrer" className="text-red-500">
                                📺
                              </a>
                            )}
                            {property.profiles?.instagram_url && (
                              <a href={property.profiles.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-500">
                                📷
                              </a>
                            )}
                            {property.profiles?.facebook_url && (
                              <a href={property.profiles.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                                📘
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Eye className="h-3 w-3 mr-1" />
                        {property.views_count}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* WhatsApp Support */}
      <div className="fixed bottom-6 right-6">
        <a
          href="https://wa.me/5217717789580"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Soporte WhatsApp"
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
          </svg>
        </a>
      </div>
    </div>
  );
};

export default PropertiesPage;
