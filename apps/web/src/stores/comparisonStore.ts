import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PropertyWithRelations } from '@shared/types/app.types';

const MAX_COMPARE = 4;

interface ComparisonState {
  items: PropertyWithRelations[];
  isOpen: boolean;

  addToComparison: (property: PropertyWithRelations) => void;
  removeFromComparison: (propertyId: string) => void;
  clearComparison: () => void;
  isInComparison: (propertyId: string) => boolean;
  setOpen: (open: boolean) => void;
  getShareUrl: () => string;
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addToComparison: (property) => {
        const { items } = get();
        if (items.length >= MAX_COMPARE) return;
        if (items.some((p) => p.id === property.id)) return;
        set({ items: [...items, property] });
      },

      removeFromComparison: (propertyId) => {
        set({ items: get().items.filter((p) => p.id !== propertyId) });
      },

      clearComparison: () => set({ items: [] }),

      isInComparison: (propertyId) => get().items.some((p) => p.id === propertyId),

      setOpen: (open) => set({ isOpen: open }),

      getShareUrl: () => {
        const slugs = get().items.map((p) => p.slug).join(',');
        return `${window.location.origin}/compare?ids=${slugs}`;
      },
    }),
    {
      name: 'comparison-store',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
