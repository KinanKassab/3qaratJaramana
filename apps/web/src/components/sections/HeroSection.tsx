import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/cn';

export function HeroSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language } = useUIStore();
  const [listingType, setListingType] = useState<'sale' | 'rent'>('sale');
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (listingType) params.set('type', listingType);
    if (search) params.set('q', search);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <section
      data-navbar-theme="dark"
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-700"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1920')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-hero-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-400/30 text-primary-200 rounded-full px-4 py-1.5 text-sm mb-6">
            <MapPin className="h-3.5 w-3.5" />
            {language === 'ar' ? 'جرمانا — ريف دمشق' : 'Jaramana — Rif Dimashq'}
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-5 leading-tight">
            {t('home.hero.title')}
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-10">
            {t('home.hero.subtitle')}
          </p>
        </motion.div>

        {/* Search form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-2xl"
        >
          {/* Listing type tabs */}
          <div className="flex gap-2 mb-4">
            {(['sale', 'rent'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setListingType(type)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  listingType === type
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-dark-600 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-700'
                )}
              >
                {type === 'sale' ? t('property.for_sale') : t('property.for_rent')}
              </button>
            ))}
          </div>

          {/* Search inputs */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
              <input
                type="text"
                placeholder={t('home.hero.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base ps-10"
              />
            </div>

            <button type="submit" className="btn-primary whitespace-nowrap">
              <Search className="h-4 w-4" />
              {t('home.hero.search_button')}
            </button>
          </form>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex items-center justify-center gap-8 mt-8 text-white/80"
        >
          {[
            { label: language === 'ar' ? 'عقار +' : '+ Properties', value: '500' },
            { label: language === 'ar' ? 'حي في جرمانا' : 'Neighborhoods', value: '8' },
            { label: language === 'ar' ? 'عميل سعيد' : 'Happy Clients', value: '1000+' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center pt-2">
          <div className="w-1 h-2 bg-white/60 rounded-full" />
        </div>
      </div>
    </section>
  );
}
