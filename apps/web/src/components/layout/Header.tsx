import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Sun, Moon, Globe, Heart,
  LogOut, User, ChevronDown, LayoutDashboard
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useComparisonStore } from '@/stores/comparisonStore';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';

export function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, language, toggleTheme, setLanguage, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { items: comparisonItems } = useComparisonStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Tracks whether the navbar is currently overlapping a dark-background
  // section — any element marked data-navbar-theme="dark" (hero banners,
  // dark CTA sections, the footer, etc). CSS mix-blend-mode silently fails to
  // blend against page content once the header (position: fixed) is
  // promoted to its own compositing layer by the browser, so instead we
  // directly compare the header's rect against each dark section's rect on
  // scroll and flip an explicit color state.
  const [onDark, setOnDark] = useState(location.pathname === '/');

  useEffect(() => {
    let frame = 0;

    const computeOnDark = () => {
      const headerHeight = headerRef.current?.offsetHeight ?? 80;
      const darkSections = document.querySelectorAll('[data-navbar-theme="dark"]');
      const isDark = Array.from(darkSections).some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < headerHeight && rect.bottom > 0;
      });
      setOnDark(isDark);
    };

    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(computeOnDark);
    };

    computeOnDark();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [location.pathname]);

  const handleLanguageToggle = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/properties', label: t('nav.properties') },
    { to: '/compare', label: t('nav.compare') },
  ];

  // shared class for icon buttons — color flips explicitly via `onDark` state
  // (set by the IntersectionObserver above) instead of relying on
  // mix-blend-mode, which silently fails to blend once the fixed header is
  // promoted to its own GPU compositing layer.
  const iconBtn = cn(
    'p-2 rounded-lg transition-colors',
    onDark ? 'text-white hover:bg-white/10' : 'text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-800'
  );

  return (
    <>
      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-transparent">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">ع</span>
              </div>
              <div className="hidden sm:block">
                <div className={cn('text-sm font-bold leading-tight', onDark ? 'text-white' : 'text-dark-900 dark:text-white')}>
                  {language === 'ar' ? 'عقارات جرمانا' : '3qarat Jaramana'}
                </div>
                <div className={cn('text-xs', onDark ? 'text-white/70' : 'text-dark-500 dark:text-dark-400')}>Real Estate</div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      onDark
                        ? cn('text-white', isActive ? 'bg-white/20' : 'hover:bg-white/10')
                        : cn(
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
                              : 'text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800'
                          )
                    )
                  }
                >
                  {link.label}
                  {link.to === '/compare' && comparisonItems.length > 0 && (
                    <span className="ms-1.5 bg-primary-500 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">
                      {comparisonItems.length}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Language */}
              <button onClick={handleLanguageToggle} className={cn(iconBtn, 'flex items-center gap-1 text-sm font-medium')} title="Toggle language">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{language === 'ar' ? 'EN' : 'عر'}</span>
              </button>

              {/* Theme */}
              <button onClick={toggleTheme} className={iconBtn} title="Toggle theme">
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>

              {/* Favorites */}
              {user && (
                <Link to="/profile?tab=favorites" className={iconBtn}>
                  <Heart className="h-4 w-4" />
                </Link>
              )}

              {/* Auth */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={cn('flex items-center gap-2 p-1.5 rounded-xl transition-colors', onDark ? 'hover:bg-white/10' : 'hover:bg-dark-100 dark:hover:bg-dark-800')}
                  >
                    <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                    <ChevronDown className={cn('h-3 w-3 hidden sm:block', onDark ? 'text-white' : 'text-dark-700 dark:text-dark-200')} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute end-0 top-full mt-2 w-52 bg-white dark:bg-dark-800 rounded-xl shadow-2xl border border-dark-100 dark:border-dark-700 overflow-hidden"
                      >
                        <div className="p-3 border-b border-dark-100 dark:border-dark-700">
                          <p className="font-semibold text-dark-900 dark:text-dark-100 text-sm truncate">{user.full_name}</p>
                          <p className="text-xs text-dark-500 truncate capitalize">{user.role}</p>
                        </div>
                        <div className="py-1">
                          <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700">
                            <User className="h-4 w-4" /> {t('profile.title')}
                          </Link>
                          {(user.role === 'admin' || user.role === 'agent') && (
                            <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700">
                              <LayoutDashboard className="h-4 w-4" /> {t('nav.admin')}
                            </Link>
                          )}
                          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 w-full">
                            <LogOut className="h-4 w-4" /> {t('nav.logout')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/auth"
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      onDark ? 'text-white hover:bg-white/10' : 'text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800'
                    )}
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/auth?tab=register"
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-colors"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={cn(iconBtn, 'md:hidden')}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: language === 'ar' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: language === 'ar' ? -20 : 20 }}
            className="fixed inset-y-0 end-0 z-50 w-80 max-w-full bg-white dark:bg-dark-900 shadow-2xl md:hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100 dark:border-dark-800 flex-shrink-0">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-white font-bold">ع</span>
                </div>
                <span className="font-bold text-dark-900 dark:text-white text-sm">
                  {language === 'ar' ? 'عقارات جرمانا' : '3qarat Jaramana'}
                </span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg text-dark-500 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col flex-1 pb-6 px-5 overflow-y-auto pt-4">
              <nav className="space-y-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'block px-4 py-3 rounded-xl font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
                          : 'text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800'
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>

              {!user && (
                <div className="mt-6 space-y-3">
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="block btn-outline text-center">
                    {t('nav.login')}
                  </Link>
                  <Link to="/auth?tab=register" onClick={() => setMobileMenuOpen(false)} className="block btn-primary text-center">
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[45] bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
