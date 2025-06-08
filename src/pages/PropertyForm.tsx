import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Trash2, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id?: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  operation_type: string;
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

const FEATURES_OPTIONS = [
  'Aire acondicionado', 'Calefacción', 'Amueblado', 'Balcón', 'Terraza',
  'Jardín', 'Acepta mascotas', 'WiFi', 'Cocina equipada', 'Closets'
];

const AMENITIES_OPTIONS = [
  'Piscina', 'Gimnasio', 'Seguridad 24h', 'Elevador', 'Portero',
  'Área de juegos', 'Salón de eventos', 'Zona BBQ', 'Estacionamiento visitantes'
];

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);

  const [property, setProperty] = useState<Property>({
    title: '',
    description: '',
    price: 0,
    currency: 'MXN',
    operation_type: 'sale',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    bedrooms: 1,
    bathrooms: 1,
    surface_total: 0,
    surface_covered: 0,
    parking_spaces: 0,
    floor_number: 0,
    total_floors: 0,
    features: [],
    amenities: []
  });

  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchUserSubscription();
    
    if (id) {
      fetchProperty();
    }
  }, [user, id, navigate]);

  useEffect(() => {
    if (property.province && MEXICO_STATES_MUNICIPALITIES[property.province as keyof typeof MEXICO_STATES_MUNICIPALITIES]) {
      setSelectedMunicipalities(MEXICO_STATES_MUNICIPALITIES[property.province as keyof typeof MEXICO_STATES_MUNICIPALITIES]);
    } else {
      setSelectedMunicipalities([]);
    }
  }, [property.province]);

  const fetchUserSubscription = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    setSubscription(data);
  };

  const fetchProperty = async () => {
    if (!id || !user) return;

    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      setProperty({
        ...data,
        features: Array.isArray(data.features) ? data.features : [],
        amenities: Array.isArray(data.amenities) ? data.amenities : []
      });
      setExistingImages(data.property_images || []);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const maxImages = getMaxImages();
    const totalImages = images.length + existingImages.length;
    
    if (totalImages + files.length > maxImages) {
      toast({
        title: "Límite de imágenes excedido",
        description: `Tu plan permite máximo ${maxImages} imágenes`,
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo inválido",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "Archivo muy grande",
          description: "Las imágenes deben ser menores a 5MB",
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);
  };

  const getMaxImages = () => {
    if (!subscription) return 5; // Basic plan
    
    switch (subscription.plan_type) {
      case 'plan_100': return 10;
      case 'plan_300': return 20;
      case 'plan_500': return 25;
      case 'plan_1000': return 30;
      case 'plan_3000': return 50;
      default: return 5;
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (mainImageIndex >= images.length - 1) {
      setMainImageIndex(0);
    }
  };

  const removeExistingImage = async (imageId: string, index: number) => {
    const { error } = await supabase
      .from('property_images')
      .delete()
      .eq('id', imageId);

    if (!error) {
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      toast({
        title: "Imagen eliminada",
        description: "La imagen ha sido eliminada correctamente",
      });
    }
  };

  const setMainImage = (index: number) => {
    setMainImageIndex(index);
  };

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

  const uploadImages = async (propertyId: string) => {
    const uploadPromises = images.map(async (image, index) => {
      const fileExt = image.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}-${index}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, image);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      await supabase
        .from('property_images')
        .insert({
          property_id: propertyId,
          image_url: publicUrl,
          is_main: index === mainImageIndex,
          sort_order: index
        });
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const propertyData = {
        ...property,
        user_id: user.id,
        status: 'published'
      };

      let propertyId = id;

      if (id) {
        // Update existing property
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new property
        const { data, error } = await supabase
          .from('properties')
          .insert([propertyData])
          .select()
          .single();

        if (error) throw error;
        propertyId = data.id;
      }

      // Upload new images if any
      if (images.length > 0 && propertyId) {
        await uploadImages(propertyId);
      }

      toast({
        title: "¡Éxito!",
        description: id ? "Propiedad actualizada correctamente" : "Propiedad creada correctamente",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la propiedad",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Editar Propiedad' : 'Nueva Propiedad'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={property.title}
                  onChange={(e) => setProperty(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="operation_type">Tipo de operación *</Label>
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
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  value={property.price}
                  onChange={(e) => setProperty(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
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
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="province">Estado *</Label>
                <Select
                  value={property.province}
                  onValueChange={(value) => setProperty(prev => ({ ...prev, province: value, city: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(MEXICO_STATES_MUNICIPALITIES).map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="city">Municipio *</Label>
                <Select
                  value={property.city}
                  onValueChange={(value) => setProperty(prev => ({ ...prev, city: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedMunicipalities.map((municipality) => (
                      <SelectItem key={municipality} value={municipality}>{municipality}</SelectItem>
                    ))}
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Dirección *</Label>
                <Input
                  id="address"
                  value={property.address}
                  onChange={(e) => setProperty(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="bedrooms">Habitaciones</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={property.bedrooms}
                  onChange={(e) => setProperty(prev => ({ ...prev, bedrooms: parseInt(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Baños</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  value={property.bathrooms}
                  onChange={(e) => setProperty(prev => ({ ...prev, bathrooms: parseFloat(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="surface_total">Superficie total (m²)</Label>
                <Input
                  id="surface_total"
                  type="number"
                  min="0"
                  value={property.surface_total}
                  onChange={(e) => setProperty(prev => ({ ...prev, surface_total: parseFloat(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="parking_spaces">Estacionamientos</Label>
                <Input
                  id="parking_spaces"
                  type="number"
                  min="0"
                  value={property.parking_spaces}
                  onChange={(e) => setProperty(prev => ({ ...prev, parking_spaces: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={property.description}
                onChange={(e) => setProperty(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Features */}
            <div>
              <Label>Características</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {FEATURES_OPTIONS.map((feature) => (
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

            {/* Amenities */}
            <div>
              <Label>Amenidades</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {AMENITIES_OPTIONS.map((amenity) => (
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

            {/* Image Upload */}
            <div>
              <Label>Imágenes (máximo {getMaxImages()})</Label>
              <div className="mt-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors block"
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">
                    Haz clic para subir imágenes o arrastra y suelta
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    PNG, JPG hasta 5MB cada una
                  </p>
                </label>
              </div>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Imágenes actuales:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.image_url}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        {image.is_main && (
                          <Star className="absolute top-1 left-1 h-4 w-4 text-yellow-500 fill-current" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(image.id, index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Preview */}
              {images.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Nuevas imágenes:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Nueva imagen ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        {index === mainImageIndex && (
                          <Star className="absolute top-1 left-1 h-4 w-4 text-yellow-500 fill-current" />
                        )}
                        <button
                          type="button"
                          onClick={() => setMainImage(index)}
                          className="absolute top-1 left-1 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                          title="Establecer como imagen principal"
                        >
                          <Star className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : (id ? 'Actualizar Propiedad' : 'Crear Propiedad')}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyForm;
