import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, GitCompare, Share2, Check } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useComparisonStore } from '@/stores/comparisonStore';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatArea, getLocalizedText } from '@shared/utils/format';
import { SEO } from '@/components/SEO';
import type { PropertyWithRelations } from '@shared/types/app.types';

export function ComparisonPage() {
  const { t } = useTranslation();
  const { language } = useUIStore();
  const { items, removeFromComparison, getShareUrl } = useComparisonStore();
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const urlSlugs = searchParams.get('ids')?.split(',').filter(Boolean) ?? [];
  const slugsToLoad = urlSlugs.length > 0 ? urlSlugs : items.map((i) => i.slug);

  useEffect(() => {
    if (slugsToLoad.length === 0) {
      setProperties([]);
      return;
    }
    setLoading(true);
    supabase
      .from('properties')
      .select(`
        *,
        images:property_images(id, url, is_cover, sort_order),
        location:locations(id, name_ar, name_en, slug),
        category:categories(id, name_ar, name_en, slug, icon),
        agent:users(id, full_name, phone, avatar_url)
      `)
      .in('slug', slugsToLoad)
      .eq('status', 'available')
      .then(({ data }) => {
        setProperties((data as PropertyWithRelations[]) ?? []);
        setLoading(false);
      });
  }, [slugsToLoad.join(',')]);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rows = [
    {
      label: language === 'ar' ? 'السعر' : 'Price',
      render: (p: PropertyWithRelations) => formatPrice(p.price, language, p.currency),
    },
    {
      label: language === 'ar' ? 'المساحة' : 'Area',
      render: (p: PropertyWithRelations) => p.area ? formatArea(p.area, language) : '—',
    },
    {
      label: language === 'ar' ? 'غرف النوم' : 'Bedrooms',
      render: (p: PropertyWithRelations) => p.bedrooms ?? '—',
    },
    {
      label: language === 'ar' ? 'الحمامات' : 'Bathrooms',
      render: (p: PropertyWithRelations) => p.bathrooms ?? '—',
    },
    {
      label: language === 'ar' ? 'الطابق' : 'Floor',
      render: (p: PropertyWithRelations) => p.floor_number ?? '—',
    },
    {
      label: language === 'ar' ? 'النوع' : 'Type',
      render: (p: PropertyWithRelations) => p.listing_type === 'sale'
        ? (language === 'ar' ? 'للبيع' : 'For Sale')
        : (language === 'ar' ? 'للإيجار' : 'For Rent'),
    },
    {
      label: language === 'ar' ? 'الموقع' : 'Location',
      render: (p: PropertyWithRelations) => p.location
        ? getLocalizedText(p.location.name_ar, p.location.name_en, language)
        : '—',
    },
    {
      label: language === 'ar' ? 'الفئة' : 'Category',
      render: (p: PropertyWithRelations) => p.category
        ? getLocalizedText(p.category.name_ar, p.category.name_en, language)
        : '—',
    },
  ];

  if (!loading && properties.length === 0) {
    return (
      <>
        <SEO
          title={language === 'ar' ? 'مقارنة العقارات' : 'Compare Properties'}
          url="/compare"
        />
        <div className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <GitCompare className="h-16 w-16 text-dark-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-dark-900 dark:text-dark-100 mb-2">
              {language === 'ar' ? 'لا توجد عقارات للمقارنة' : 'No properties to compare'}
            </h2>
            <p className="text-dark-500 mb-6">
              {language === 'ar'
                ? 'أضف عقارات من قائمة العقارات لمقارنتها'
                : 'Add properties from the listings to compare them'}
            </p>
            <Link to="/properties" className="btn-primary">
              {t('nav.properties')}
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={language === 'ar' ? 'مقارنة العقارات' : 'Compare Properties'}
        url="/compare"
      />

      <div className="pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">
              {language === 'ar' ? 'مقارنة العقارات' : 'Compare Properties'}
            </h1>
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dark-200 dark:border-dark-600 text-sm font-medium hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
            >
              {copied
                ? <><Check className="h-4 w-4 text-primary-500" /> {language === 'ar' ? 'تم النسخ' : 'Copied!'}</>
                : <><Share2 className="h-4 w-4" /> {language === 'ar' ? 'مشاركة المقارنة' : 'Share Comparison'}</>
              }
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="w-28 sm:w-40 text-start p-4 text-dark-500 font-medium text-sm">
                    {language === 'ar' ? 'التفاصيل' : 'Details'}
                  </th>
                  {properties.map((p) => {
                    const cover = p.images?.find((i) => i.is_cover) ?? p.images?.[0];
                    const title = getLocalizedText(p.title_ar, p.title_en, language);
                    return (
                      <th key={p.id} className="p-4 min-w-[160px] sm:min-w-[220px]">
                        <div className="relative">
                          {urlSlugs.length === 0 && (
                            <button
                              onClick={() => removeFromComparison(p.id)}
                              className="absolute -top-2 -end-2 p-1 bg-dark-200 dark:bg-dark-700 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                          {cover && (
                            <img
                              src={cover.url}
                              alt={title}
                              className="w-full h-36 object-cover rounded-xl mb-3"
                            />
                          )}
                          <Link
                            to={`/property/${p.slug}`}
                            className="font-bold text-dark-900 dark:text-dark-100 hover:text-primary-500 text-sm line-clamp-2 block"
                          >
                            {title}
                          </Link>
                          <p className="text-primary-600 font-semibold text-sm mt-1" dir="ltr">
                            {formatPrice(p.price, language, p.currency)}
                          </p>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.label}
                    className={idx % 2 === 0 ? 'bg-dark-50 dark:bg-dark-800/50' : ''}
                  >
                    <td className="p-4 text-sm font-medium text-dark-700 dark:text-dark-300">
                      {row.label}
                    </td>
                    {properties.map((p) => (
                      <td key={p.id} className="p-4 text-sm text-dark-600 dark:text-dark-400 text-center">
                        {row.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {urlSlugs.length === 0 && (
            <div className="mt-6 text-center">
              <Link to="/properties" className="btn-outline">
                {language === 'ar' ? 'إضافة المزيد' : 'Add More Properties'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
