import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/cn';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultTab, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabList({ children, className }: TabListProps) {
  return (
    <div
      className={cn(
        'flex gap-1 bg-dark-100 dark:bg-dark-800 rounded-xl p-1',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabProps {
  id: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Tab({ id, children, icon }: TabProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) return null;
  const isActive = ctx.activeTab === id;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.setActiveTab(id)}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm'
          : 'text-dark-500 hover:text-dark-700 dark:hover:text-dark-300'
      )}
    >
      {icon}
      {children}
    </button>
  );
}

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ id, children, className }: TabPanelProps) {
  const ctx = useContext(TabsContext);
  if (!ctx || ctx.activeTab !== id) return null;
  return <div role="tabpanel" className={className}>{children}</div>;
}
