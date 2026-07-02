import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export function Footer() {
  const { t } = useTranslation();
  const { language } = useUIStore();

  const currentYear = new Date().getFullYear();

  return (
    <footer data-navbar-theme="dark" className="bg-secondary-800 dark:bg-dark-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">ع</span>
              </div>
              <div>
                <div className="font-bold text-lg">
                  {language === 'ar' ? 'عقارات جرمانا' : '3qarat Jaramana'}
                </div>
                <div className="text-xs text-primary-300">Real Estate Platform</div>
              </div>
            </div>
            <p className="text-dark-300 text-sm leading-relaxed">
              {language === 'ar'
                ? 'منصتك الأولى للبحث عن العقارات في جرمانا ودمشق وريف دمشق'
                : 'Your #1 platform for real estate in Jaramana, Damascus & Rif Dimashq'}
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">
              {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h3>
            <ul className="space-y-2.5">
              {[
                { to: '/', label: t('nav.home') },
                { to: '/properties', label: t('nav.properties') },
                { to: '/compare', label: t('nav.compare') },
                { to: '/favorites', label: t('nav.favorites') },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-dark-300 hover:text-primary-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-lg mb-4">
              {language === 'ar' ? 'التصنيفات' : 'Categories'}
            </h3>
            <ul className="space-y-2.5">
              {[
                { slug: 'apartments', label: t('categories.apartments') },
                { slug: 'villas', label: t('categories.villas') },
                { slug: 'houses', label: t('categories.houses') },
                { slug: 'land', label: t('categories.land') },
                { slug: 'commercial', label: t('categories.commercial') },
                { slug: 'offices', label: t('categories.offices') },
              ].map((cat) => (
                <li key={cat.slug}>
                  <Link
                    to={`/properties?category=${cat.slug}`}
                    className="text-dark-300 hover:text-primary-400 text-sm transition-colors"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">
              {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <span className="text-dark-300 text-sm">
                  {language === 'ar' ? 'جرمانا، ريف دمشق، سوريا' : 'Jaramana, Rif Dimashq, Syria'}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary-400 flex-shrink-0" />
                <a href="tel:+963112345678" className="text-dark-300 hover:text-primary-400 text-sm transition-colors" dir="ltr">
                  +963 11 234 5678
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary-400 flex-shrink-0" />
                <a href="mailto:info@3qaratjaramana.com" className="text-dark-300 hover:text-primary-400 text-sm transition-colors">
                  info@3qaratjaramana.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-dark-400 text-sm">
            &copy; {currentYear} {language === 'ar' ? 'عقارات جرمانا. جميع الحقوق محفوظة.' : '3qarat Jaramana. All rights reserved.'}
          </p>
          <div className="flex items-center gap-4 text-sm text-dark-400">
            <Link to="/privacy" className="hover:text-primary-400 transition-colors">
              {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </Link>
            <Link to="/terms" className="hover:text-primary-400 transition-colors">
              {language === 'ar' ? 'شروط الاستخدام' : 'Terms of Use'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
