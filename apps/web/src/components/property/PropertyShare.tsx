import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, MessageCircle, Link2, QrCode } from 'lucide-react';
import type { PropertyWithRelations } from '@shared/types/app.types';
import { buildWhatsAppLink } from '@shared/utils/whatsapp';
import { useUIStore } from '@/stores/uiStore';
import { Modal } from '@/components/ui/Modal';
import { PropertyQR } from './PropertyQR';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';

interface PropertyShareProps {
  property: PropertyWithRelations;
}

const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://3qaratjaramana.com';

export function PropertyShare({ property }: PropertyShareProps) {
  const { t } = useTranslation();
  const { language } = useUIStore();
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const propertyUrl = `${APP_URL}/property/${property.slug}`;
  const whatsAppUrl = buildWhatsAppLink(property, language, APP_URL);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(propertyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Track share event
    supabase.rpc('increment_analytics', {
      p_property_id: property.id,
      p_event_type: 'share',
    }).then(() => {});
  };

  const handleWhatsApp = () => {
    // Track WhatsApp click
    supabase.rpc('increment_analytics', {
      p_property_id: property.id,
      p_event_type: 'whatsapp_click',
    }).then(() => {});
    window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
  };

  const actions = [
    {
      icon: copied ? Check : Copy,
      label: copied ? t('common.link_copied') : t('common.copy_link'),
      onClick: handleCopyLink,
      active: copied,
      color: 'text-dark-600 dark:text-dark-400',
    },
    {
      icon: MessageCircle,
      label: t('property.whatsapp'),
      onClick: handleWhatsApp,
      color: 'text-emerald-600',
    },
    {
      icon: QrCode,
      label: t('property.qr_code'),
      onClick: () => setQrOpen(true),
      color: 'text-dark-600 dark:text-dark-400',
    },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
              'bg-dark-50 dark:bg-dark-700 hover:bg-dark-100 dark:hover:bg-dark-600',
              'transition-colors border border-dark-200 dark:border-dark-600',
              action.color,
              action.active && 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-600'
            )}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </button>
        ))}
      </div>

      <Modal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        title={t('property.qr_code')}
        size="sm"
      >
        <PropertyQR slug={property.slug} title={property.title_ar} />
      </Modal>
    </>
  );
}
