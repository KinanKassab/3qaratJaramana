import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Shield, Clock, Award, Users, MapPin, Phone, Mail,
  CheckCircle2, ArrowLeft, ArrowRight
} from 'lucide-react';
import { useLatestProperties } from '@/hooks/useProperties';
import { useLocations } from '@/hooks/useLocations';
import { useUIStore } from '@/stores/uiStore';
import { HeroSection } from '@/components/sections/HeroSection';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { SEO } from '@/components/SEO';
import { getLocalizedText } from '@shared/utils/format';
import { buildWhatsAppContactLink } from '@shared/utils/whatsapp';
import { CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from '@shared/utils/constants';

function SectionHeader({ title, subtitle, cta, ctaHref }: {
  title: string;
  subtitle?: string;
  cta?: string;
  ctaHref?: string;
}) {
  const { language } = useUIStore();
  const Arrow = language === 'ar' ? ArrowLeft : ArrowRight;
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h2 className="section-heading">{title}</h2>
        {subtitle && <p className="section-subheading">{subtitle}</p>}
      </div>
      {cta && ctaHref && (
        <Link
          to={ctaHref}
          className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:gap-3 transition-all text-sm whitespace-nowrap mt-1"
        >
          {cta} <Arrow className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { language } = useUIStore();
  const { data: latest, isLoading: loadingLatest } = useLatestProperties(8);
  // All active districts are Jaramana neighborhoods — the platform is Jaramana-only
  const { data: neighborhoods } = useLocations('district');

  const whyUsItems = [
    {
      icon: Shield,
      title: language === 'ar' ? 'عقارات موثوقة' : 'Verified Properties',
      desc: language === 'ar' ? 'جميع عقاراتنا مدققة ومعتمدة من فريقنا المتخصص' : 'All properties are verified by our expert team',
    },
    {
      icon: Clock,
      title: language === 'ar' ? 'دعم على مدار الساعة' : '24/7 Support',
      desc: language === 'ar' ? 'فريقنا متاح دائماً للإجابة على استفساراتك' : 'Our team is always available to answer your questions',
    },
    {
      icon: Award,
      title: language === 'ar' ? 'خبرة واسعة' : 'Expert Agents',
      desc: language === 'ar' ? 'وكلاؤنا يمتلكون سنوات من الخبرة في السوق المحلي' : 'Our agents have years of local market experience',
    },
    {
      icon: Users,
      title: language === 'ar' ? 'آلاف العملاء السعداء' : 'Thousands of Happy Clients',
      desc: language === 'ar' ? 'نفخر بثقة آلاف العملاء منذ تأسيسنا' : 'We are proud of thousands of satisfied clients since founding',
    },
  ];

  const testimonials = [
    {
      name: language === 'ar' ? 'محمد أحمد' : 'Mohammed Ahmad',
      role: language === 'ar' ? 'عميل' : 'Client',
      text: language === 'ar'
        ? 'وجدت شقة أحلامي في جرمانا عبر هذه المنصة الرائعة. الخدمة ممتازة والفريق محترف جداً.'
        : 'Found my dream apartment in Jaramana through this amazing platform. Excellent service and very professional team.',
    },
    {
      name: language === 'ar' ? 'سارة خالد' : 'Sara Khaled',
      role: language === 'ar' ? 'عميلة' : 'Client',
      text: language === 'ar'
        ? 'أفضل منصة عقارية في المنطقة. تجربة ممتازة من البحث حتى إتمام الصفقة.'
        : 'Best real estate platform in the area. Excellent experience from search to closing the deal.',
    },
  ];

  return (
    <>
      <SEO
        title={language === 'ar' ? 'الرئيسية' : 'Home'}
        description={language === 'ar'
          ? 'ابحث عن عقارك المثالي في جرمانا - شقق وفلل وأراضي للبيع والإيجار'
          : 'Find your perfect property in Jaramana - Apartments, villas, land for sale & rent'}
      />

      {/* Hero */}
      <HeroSection />

      {/* Latest Properties */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto bg-dark-50 dark:bg-dark-900/50 rounded-3xl">
        <SectionHeader
          title={t('home.latest')}
          subtitle={language === 'ar' ? 'أحدث العقارات المضافة' : 'The newest properties added'}
          cta={t('common.view_all')}
          ctaHref="/properties"
        />
        <PropertyGrid properties={latest} loading={loadingLatest} skeletonCount={8} columns={4} />
      </section>

      {/* Popular Neighborhoods — Jaramana's districts */}
      {neighborhoods && neighborhoods.length > 0 && (
        <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
          <SectionHeader
            title={t('home.popular_locations')}
            subtitle={language === 'ar' ? 'استكشف أحياء جرمانا الأكثر طلباً' : "Explore Jaramana's most sought-after neighborhoods"}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {neighborhoods.slice(0, 8).map((district, idx) => (
              <motion.div
                key={district.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/properties?location_id=${district.id}`}
                  className="relative group block rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-secondary-700 to-secondary-900"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-1.5 text-white">
                      <MapPin className="h-4 w-4 text-primary-400" />
                      <span className="font-semibold">
                        {getLocalizedText(district.name_ar, district.name_en, language)}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-heading">{t('home.why_us')}</h2>
          <p className="section-subheading">
            {language === 'ar'
              ? 'نحن نقدم لك أفضل تجربة في البحث عن العقارات'
              : 'We provide the best real estate search experience'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyUsItems.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="text-center p-6 rounded-2xl bg-white dark:bg-dark-800 shadow-card"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-7 w-7 text-primary-500" />
              </div>
              <h3 className="font-bold text-dark-900 dark:text-dark-100 mb-2">{item.title}</h3>
              <p className="text-sm text-dark-500 dark:text-dark-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-heading">{t('home.testimonials')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-card"
            >
              <p className="text-dark-600 dark:text-dark-300 mb-4 leading-relaxed italic">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-dark-900 dark:text-dark-100 text-sm">{t.name}</p>
                  <p className="text-dark-400 text-xs">{t.role}</p>
                </div>
                <div className="ms-auto flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="text-primary-400 text-sm">★</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section data-navbar-theme="dark" className="py-16 px-4 sm:px-6 bg-secondary-800 dark:bg-dark-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </h2>
          <p className="text-dark-200 mb-10">
            {language === 'ar'
              ? 'هل لديك استفسار؟ فريقنا جاهز للمساعدة'
              : 'Have a question? Our team is ready to help'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href={`tel:${CONTACT_PHONE}`}
              className="flex items-center justify-center gap-3 px-5 py-3.5 sm:px-8 sm:py-4 bg-primary-500 hover:bg-primary-600 rounded-xl font-semibold transition-colors"
              dir="ltr"
            >
              <Phone className="h-5 w-5" />
              {CONTACT_PHONE_DISPLAY}
            </a>
            <a
              href={buildWhatsAppContactLink(CONTACT_PHONE, language === 'ar' ? 'مرحباً، لدي استفسار عن عقاراتكم في جرمانا' : 'Hello, I have a question about your properties in Jaramana')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-5 py-3.5 sm:px-8 sm:py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-semibold transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </a>
            <a
              href="mailto:info@3qaratjaramana.com"
              className="flex items-center justify-center gap-3 px-5 py-3.5 sm:px-8 sm:py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
            >
              <Mail className="h-5 w-5" />
              {language === 'ar' ? 'راسلنا' : 'Email Us'}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
