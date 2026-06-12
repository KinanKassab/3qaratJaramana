import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useUIStore } from '@/stores/uiStore';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

const DEFAULT_TITLE = 'عقارات جرمانا | 3qarat Jaramana';
const DEFAULT_DESC =
  'أفضل منصة لبيع وإيجار العقارات في جرمانا ودمشق وريف دمشق - Best real estate platform in Jaramana, Damascus & Rif Dimashq';
const DEFAULT_IMAGE = '/og-image.jpg';
const SITE_URL = import.meta.env.VITE_APP_URL ?? 'https://3qaratjaramana.com';

export function SEO({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noIndex = false,
}: SEOProps) {
  const { language } = useUIStore();
  const fullTitle = title ? `${title} | عقارات جرمانا` : DEFAULT_TITLE;
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      <html lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="عقارات جرمانا" />
      <meta property="og:locale" content={language === 'ar' ? 'ar_SY' : 'en_US'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}
