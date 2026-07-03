import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { formatPrice, getLocalizedText } from '@shared/utils/format';
import type { PropertyWithRelations } from '@shared/types/app.types';
import { Spinner } from '@/components/ui/Spinner';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
];

interface PropertyMapProps {
  properties?: PropertyWithRelations[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  showInfoWindow?: boolean;
  onMarkerClick?: (property: PropertyWithRelations) => void;
}

export function PropertyMap({
  properties = [],
  center = { lat: 33.487, lng: 36.341 }, // Jaramana
  zoom = 12,
  height = '400px',
  showInfoWindow = true,
}: PropertyMapProps) {
  const { t } = useTranslation();
  const { theme, language } = useUIStore();
  const [selected, setSelected] = useState<PropertyWithRelations | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: MAPS_API_KEY,
    libraries: ['places'],
  });

  const onMapClick = useCallback(() => setSelected(null), []);

  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center bg-dark-100 dark:bg-dark-800 rounded-2xl"
        style={{ height }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={zoom}
        onClick={onMapClick}
        options={{
          styles: theme === 'dark' ? DARK_MAP_STYLE : undefined,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {properties
          .filter((p) => p.latitude != null && p.longitude != null)
          .map((property) => (
            <MarkerF
              key={property.id}
              position={{ lat: property.latitude!, lng: property.longitude! }}
              onClick={() => showInfoWindow && setSelected(property)}
              label={{
                text: formatPrice(property.price, language, property.currency).split('.')[0],
                className: 'text-xs font-bold',
                color: '#fff',
              }}
              icon={{
                url: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#1B3A5C" stroke="white" stroke-width="2"/></svg>`),
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(18, 18),
              }}
            />
          ))}

        {selected && showInfoWindow && selected.latitude && selected.longitude && (
          <InfoWindowF
            position={{ lat: selected.latitude, lng: selected.longitude }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="p-2 max-w-[220px]">
              {selected.images?.[0] && (
                <img
                  src={selected.images[0].url}
                  alt={selected.title_ar}
                  className="w-full h-28 object-cover rounded-lg mb-2"
                />
              )}
              <p className="font-bold text-sm text-dark-900 line-clamp-2">
                {getLocalizedText(selected.title_ar, selected.title_en, language)}
              </p>
              <p className="text-primary-600 font-semibold text-sm mt-1">
                {formatPrice(selected.price, language, selected.currency)}
              </p>
              <Link
                to={`/property/${selected.slug}`}
                className="mt-2 block text-center bg-primary-500 text-white text-xs py-1.5 rounded-lg hover:bg-primary-600 transition-colors"
              >
                {t('common.view_all')}
              </Link>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}

export function SinglePropertyMap({
  lat,
  lng,
  title,
  height = '350px',
}: {
  lat: number;
  lng: number;
  title: string;
  height?: string;
}) {
  const { theme } = useUIStore();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: MAPS_API_KEY,
  });

  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center bg-dark-100 dark:bg-dark-800 rounded-2xl"
        style={{ height }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl overflow-hidden" style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ lat, lng }}
          zoom={15}
          options={{
            styles: theme === 'dark' ? DARK_MAP_STYLE : undefined,
            disableDefaultUI: false,
            mapTypeControl: false,
            streetViewControl: true,
          }}
        >
          <MarkerF position={{ lat, lng }} title={title} />
        </GoogleMap>
      </div>
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-outline w-full justify-center text-sm"
      >
        الحصول على الاتجاهات / Get Directions
      </a>
    </div>
  );
}
