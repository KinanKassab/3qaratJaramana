import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, Calendar, FolderOpen,
  MapPin, Bell, LogOut, Menu, Sun, Moon, Globe, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/cn';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم', labelEn: 'Dashboard' },
  { to: '/properties', icon: Building2, label: 'العقارات', labelEn: 'Properties' },
  { to: '/users', icon: Users, label: 'المستخدمون', labelEn: 'Users' },
  { to: '/appointments', icon: Calendar, label: 'المواعيد', labelEn: 'Appointments' },
  { to: '/categories', icon: FolderOpen, label: 'الفئات', labelEn: 'Categories' },
  { to: '/locations', icon: MapPin, label: 'المناطق', labelEn: 'Locations' },
  { to: '/notifications', icon: Bell, label: 'الإشعارات', labelEn: 'Notifications' },
];

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  const { language, theme, sidebarCollapsed, setLanguage, setTheme, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const isRTL = language === 'ar';
  const CollapseIcon = (sidebarCollapsed ? (isRTL ? ChevronLeft : ChevronRight) : (isRTL ? ChevronRight : ChevronLeft));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-dark-50 dark:bg-dark-950">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-secondary-800 dark:bg-dark-900 text-white transition-all duration-300 flex-shrink-0',
          sidebarCollapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-700 dark:border-dark-700">
          {!sidebarCollapsed && (
            <span className="text-primary-400 font-bold text-lg">عقارات جرمانا</span>
          )}
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-secondary-700 transition-colors ms-auto">
            <CollapseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors mx-2 rounded-xl mb-0.5',
                isActive
                  ? 'bg-primary-500/20 text-primary-300'
                  : 'text-secondary-200 hover:bg-secondary-700 hover:text-white',
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{language === 'ar' ? item.label : item.labelEn}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + actions */}
        <div className="border-t border-secondary-700 dark:border-dark-700 p-4 space-y-2">
          {!sidebarCollapsed && user && (
            <div className="text-xs text-secondary-300 truncate">{user.full_name}</div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-secondary-700 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="p-2 rounded-lg hover:bg-secondary-700 transition-colors"
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors ms-auto"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-dark-800 border-b border-dark-200 dark:border-dark-700 flex items-center px-6 gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-dark-900 dark:text-dark-100 font-semibold ms-2">
            {language === 'ar' ? 'لوحة التحكم' : 'Admin Dashboard'}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
