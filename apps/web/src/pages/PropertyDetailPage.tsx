import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bed, Bath, Maximize2, MapPin, Phone, MessageCircle,
  Share2, Calendar, Building2, Eye
} from 'lucide-react';
import { useProperty } from '@/hooks/useProperties';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatArea, formatDate, getLocalizedText } from '@shared/utils/format';
import { buildWhatsAppContactLink } from '@shared/utils/whatsapp';
import { SEO } from '@/components/SEO';
import { PropertyImageSlider } from '@/components/property/PropertyImageSlider';
import { PropertyVideoPlayer } from '@/components/property/PropertyVideoPlayer';
import { AmenitiesGrid } from '@/components/property/AmenitiesGrid';
import { PropertyShare } from '@/components/property/PropertyShare';
import { AppointmentBooking } from '@/components/property/AppointmentBooking';
import { FavoriteButton } from '@/components/property/FavoriteButton';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';

const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://3qaratjaramana.com';

export function PropertyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { language } = useUIStore();
  const { user } = useAuthStore();
  const { data: property, isLoading, isError } = useProperty(slug ?? '');
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Track view
  useEffect(() => {
    if (!property) return;
    const sessionId = sessionStorage.getItem('session_id') ??
      (() => {
        const id = Math.random().toString(36).slice(2);
        sessionStorage.setItem('session_id', id);
        return id;
      })();

    supabase.rpc('increment_view_count', { p_property_id: property.id }).then(() => {});
    supabase.from('property_views').insert({
      property_id: property.id,
      user_id: user?.id ?? null,
      session_id: sessionId,
    }).then(() => {});
  }, [property?.id]);

  if (isLoading) {
    return (
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div><Skeleton className="h-96 w-full" /></div>
        </div>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="pt-24 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-dark-900 dark:text-dark-100 mb-2">
            {t('common.not_found')}
          </h2>
          <Link to="/properties" className="btn-primary mt-4">
            {t('nav.properties')}
          </Link>
        </div>
      </div>
    );
  }

  const title = getLocalizedText(property.title_ar, property.title_en, language);
  const description = getLocalizedText(property.description_ar, property.description_en, language);
  const locationName = property.location
    ? getLocalizedText(property.location.name_ar, property.location.name_en, language)
    : null;
  const categoryName = property.category
    ? getLocalizedText(property.category.name_ar, property.category.name_en, language)
    : null;

  const agentWhatsApp = property.agent?.phone
    ? buildWhatsAppContactLink(property.agent.phone, `أريد الاستفسار عن: ${title}`)
    : null;

  return (
    <>
      <SEO
        title={title}
        description={description ?? t('app.tagline')}
        image={property.images?.[0]?.url}
        url={`/property/${property.slug}`}
        type="article"
      />

      <div className="pt-20 pb-20 lg:pb-0 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-dark-50 dark:bg-dark-900 border-b border-dark-100 dark:border-dark-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-dark-500">
              <Link to="/" className="hover:text-primary-500">{t('nav.home')}</Link>
              <span>/</span>
              <Link to="/properties" className="hover:text-primary-500">{t('nav.properties')}</Link>
              <span>/</span>
              <span className="text-dark-800 dark:text-dark-200 truncate">{title}</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image Slider */}
              <PropertyImageSlider images={property.images ?? []} title={title} />

              {/* Title + badges */}
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={property.listing_type === 'sale' ? 'sale' : 'rent'} size="md">
                      {property.listing_type === 'sale' ? t('property.for_sale') : t('property.for_rent')}
                    </Badge>
                    {categoryName && (
                      <Badge variant="default" size="md">{categoryName}</Badge>
                    )}
                    {property.is_featured && (
                      <Badge variant="featured" size="md">{t('property.featured')}</Badge>
                    )}
                    {property.status === 'sold' && (
                      <Badge variant="sold" size="md">{t('property.sold')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-dark-400 text-sm">
                      <Eye className="h-4 w-4" />
                      {property.view_count}
                    </div>
                    <FavoriteButton propertyId={property.id} size="md" />
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 dark:text-dark-100 mb-2">
                  {title}
                </h1>

                {locationName && (
                  <div className="flex items-center gap-2 text-dark-500 dark:text-dark-400">
                    <MapPin className="h-4 w-4 text-primary-500" />
                    <span>{locationName}</span>
                    {property.address_ar && (
                      <span> — {getLocalizedText(property.address_ar, property.address_en, language)}</span>
                    )}
                  </div>
                )}

                <p className="text-xs text-dark-400 mt-1">
                  {t('common.at')} {formatDate(property.created_at, language)}
                </p>
              </div>

              {/* Tabs */}
              <Tabs defaultTab="details">
                <TabList className="mb-6">
                  <Tab id="details">{t('property.details')}</Tab>
                  {property.videos && property.videos.length > 0 && (
                    <Tab id="video">{t('property.video')}</Tab>
                  )}
                </TabList>

                <TabPanel id="details" className="space-y-6">
                  {/* Key facts */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { icon: Bed, label: t('property.bedrooms'), value: property.bedrooms },
                      { icon: Bath, label: t('property.bathrooms'), value: property.bathrooms },
                      { icon: Maximize2, label: t('property.area'), value: property.area ? formatArea(property.area, language) : null },
                      { icon: Building2, label: t('property.floor'), value: property.floor_number },
                    ]
                      .filter((item) => item.value != null)
                      .map((item) => (
                        <div
                          key={item.label}
                          className="flex flex-col items-center p-4 rounded-2xl bg-dark-50 dark:bg-dark-800 text-center"
                        >
                          <item.icon className="h-6 w-6 text-primary-500 mb-2" />
                          <span className="text-xl font-bold text-dark-900 dark:text-dark-100">
                            {item.value}
                          </span>
                          <span className="text-xs text-dark-400 mt-0.5">{item.label}</span>
                        </div>
                      ))}
                  </div>

                  {/* Description */}
                  {description && (
                    <div>
                      <h3 className="font-bold text-lg text-dark-900 dark:text-dark-100 mb-3">
                        {language === 'ar' ? 'وصف العقار' : 'Property Description'}
                      </h3>
                      <p className="text-dark-600 dark:text-dark-400 leading-relaxed whitespace-pre-line">
                        {description}
                      </p>
                    </div>
                  )}

                  {/* Amenities */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div>
                      <h3 className="font-bold text-lg text-dark-900 dark:text-dark-100 mb-3">
                        {t('property.amenities')}
                      </h3>
                      <AmenitiesGrid amenities={property.amenities} />
                    </div>
                  )}
                </TabPanel>

                <TabPanel id="video">
                  {property.videos?.map((video) => (
                    <PropertyVideoPlayer key={video.id} video={video} />
                  ))}
                </TabPanel>


              </Tabs>

              {/* Share */}
              <div>
                <h3 className="font-bold text-lg text-dark-900 dark:text-dark-100 mb-3">
                  {t('common.share')}
                </h3>
                <PropertyShare property={property} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Price Card */}
              <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-card p-6 lg:sticky lg:top-24">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" dir="ltr">
                  {formatPrice(property.price, language, 'SYP', property.price_period)}
                </div>
                <p className="text-dark-500 text-sm mb-5">
                  {property.area ? formatArea(property.area, language) : ''}
                </p>

                {/* Agent */}
                {property.agent && (
                  <div className="flex items-center gap-3 p-4 bg-dark-50 dark:bg-dark-700 rounded-xl mb-5">
                    <Avatar src={property.agent.avatar_url} name={property.agent.full_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dark-900 dark:text-dark-100 truncate">
                        {property.agent.full_name}
                      </p>
                      <p className="text-xs text-dark-400">
                        {language === 'ar' ? 'الوكيل العقاري' : 'Property Agent'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact buttons */}
                <div className="space-y-3">
                  {property.agent?.phone && (
                    <a
                      href={`tel:${property.agent.phone}`}
                      className="btn-secondary w-full justify-center gap-2 py-3"
                    >
                      <Phone className="h-4 w-4" />
                      {property.agent.phone}
                    </a>
                  )}

                  {agentWhatsApp && (
                    <a
                      href={agentWhatsApp}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        supabase.rpc('increment_analytics', {
                          p_property_id: property.id,
                          p_event_type: 'whatsapp_click',
                        }).then(() => {});
                      }}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}

                  <button
                    onClick={() => setAppointmentOpen(true)}
                    className="btn-outline w-full justify-center gap-2 py-3"
                  >
                    <Calendar className="h-4 w-4" />
                    {t('property.book_appointment')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom contact bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-dark-900 border-t border-dark-100 dark:border-dark-800 p-3 flex gap-2">
        {property.agent?.phone && (
          <a
            href={`tel:${property.agent.phone}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 text-sm font-semibold text-dark-800 dark:text-dark-200"
          >
            <Phone className="h-4 w-4" />
            {t('common.call')}
          </a>
        )}
        {agentWhatsApp && (
          <a
            href={agentWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        )}
        <button
          onClick={() => setAppointmentOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold"
        >
          <Calendar className="h-4 w-4" />
          {t('property.book_appointment')}
        </button>
      </div>

      {/* Appointment Modal */}
      <Modal
        isOpen={appointmentOpen}
        onClose={() => setAppointmentOpen(false)}
        title={t('appointment.title')}
      >
        {user ? (
          <AppointmentBooking
            propertyId={property.id}
            agentId={property.agent_id}
            onSuccess={() => setAppointmentOpen(false)}
          />
        ) : (
          <div className="text-center py-6">
            <p className="text-dark-600 mb-4">{t('errors.unauthorized')}</p>
            <Link to="/auth" className="btn-primary">{t('nav.login')}</Link>
          </div>
        )}
      </Modal>
    </>
  );
}
