import React from 'react';
import { useStore } from '../store/useStore';
import { School } from '../types';
import { X, Instagram, Mail, MapPin, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface SchoolDetailsProps {
  onClose: () => void;
}

const schoolSchema = z.object({
  name: z.string().min(3, 'Le nom doit faire au moins 3 caractères'),
  address: z.string().min(5, "L'adresse doit faire au moins 5 caractères"),
  email: z.string().email('Email invalide'),
  instagram: z.string().url('URL Instagram invalide').optional().or(z.literal('')),
  logo: z.string().url('URL du logo invalide').optional().or(z.literal('')),
});

type SchoolFormInputs = z.infer<typeof schoolSchema>;

function GeocoderControl() {
  const map = useMap();

  React.useEffect(() => {
    const geocoder = (L.Control as any).Geocoder.nominatim();
    const control = (L.Control as any).geocoder({
      geocoder,
      defaultMarkGeocode: false,
    }).addTo(map);

    control.on('markgeocode', function(e: any) {
      const { center } = e.geocode;
      map.setView(center, map.getZoom());
    });

    return () => {
      control.remove();
    };
  }, [map]);

  return null;
}

export function SchoolDetails({ onClose }: SchoolDetailsProps) {
  const { user, school, updateSchool } = useStore();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [coordinates, setCoordinates] = React.useState<[number, number] | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolFormInputs>({
    resolver: zodResolver(schoolSchema),
    defaultValues: school || undefined,
  });

  React.useEffect(() => {
    if (!school?.address) return;

    const geocoder = new (L.Control as any).Geocoder.Nominatim();
    geocoder.geocode(school.address, (results: any[]) => {
      if (results && results.length > 0) {
        setCoordinates([results[0].center.lat, results[0].center.lng]);
      }
    });
  }, [school?.address]);

  const handleUpdateSchool = async (data: SchoolFormInputs) => {
    try {
      setIsLoading(true);
      await updateSchool(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating school:', error);
      alert("Une erreur s'est produite lors de la mise à jour de l'école.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!school) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Modifier l'école" : "Détails de l'école"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit(handleUpdateSchool)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom de l'école
                  <input
                    type="text"
                    {...register('name')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </label>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Logo URL
                  <input
                    type="url"
                    {...register('logo')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    placeholder="https://example.com/logo.png"
                  />
                </label>
                {errors.logo && (
                  <p className="mt-1 text-sm text-red-600">{errors.logo.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Adresse
                  <input
                    type="text"
                    {...register('address')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </label>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email de contact
                  <input
                    type="email"
                    {...register('email')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </label>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Instagram URL
                  <input
                    type="url"
                    {...register('instagram')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    placeholder="https://www.instagram.com/votre_ecole"
                  />
                </label>
                {errors.instagram && (
                  <p className="mt-1 text-sm text-red-600">{errors.instagram.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    "Mettre à jour"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                {school.logo ? (
                  <img
                    src={school.logo}
                    alt={`Logo ${school.name}`}
                    className="h-32 w-auto object-contain"
                  />
                ) : (
                  <div className="h-32 w-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-900">{school.address}</p>
                    {coordinates && (
                      <div className="h-64 w-full mt-2 rounded-lg overflow-hidden">
                        <MapContainer
                          center={coordinates}
                          zoom={15}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />
                          <Marker position={coordinates}>
                            <Popup>{school.name}</Popup>
                          </Marker>
                          <GeocoderControl />
                        </MapContainer>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a
                    href={`mailto:${school.email}`}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    {school.email}
                  </a>
                </div>

                {school.instagram && (
                  <div className="flex items-center space-x-2">
                    <Instagram className="w-5 h-5 text-gray-400" />
                    <a
                      href={school.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700"
                    >
                      Suivre sur Instagram
                    </a>
                  </div>
                )}
              </div>

              {user?.role === 'teacher' && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Modifier
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}