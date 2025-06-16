
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, Star } from 'lucide-react';

interface ImageData {
  file?: File;
  url: string;
  isMain: boolean;
}

interface PropertyImageUploadProps {
  images: ImageData[];
  setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
  uploading: boolean;
  setUploading: React.Dispatch<React.SetStateAction<boolean>>;
}

const PropertyImageUpload: React.FC<PropertyImageUploadProps> = ({
  images,
  setImages,
  uploading,
  setUploading
}) => {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ImageData = {
          file,
          url: e.target?.result as string,
          isMain: images.length === 0 // First image is main by default
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // If we removed the main image, make the first one main
      if (prev[index].isMain && newImages.length > 0) {
        newImages[0].isMain = true;
      }
      return newImages;
    });
  };

  const handleSetMainImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isMain: i === index
    })));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Fotos de la Propiedad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Sube las fotos de tu propiedad
            </p>
            <p className="text-gray-500">
              Arrastra y suelta aquí o haz clic para seleccionar
            </p>
            <Button type="button" className="mt-4">
              Seleccionar Fotos
            </Button>
          </label>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
                  alt={`Propiedad ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                
                {image.isMain && (
                  <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Principal
                  </Badge>
                )}

                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  {!image.isMain && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetMainImage(index)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-gray-500">
          * La primera imagen será la foto principal. Puedes cambiarla haciendo clic en la estrella.
        </p>
      </CardContent>
    </Card>
  );
};

export default PropertyImageUpload;
