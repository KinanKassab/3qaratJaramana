import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

interface PropertyQRProps {
  slug: string;
  title: string;
}

const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://3qaratjaramana.com';

export function PropertyQR({ slug, title }: PropertyQRProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propertyUrl = `${APP_URL}/property/${slug}`;

  const handleDownload = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-qr-canvas]');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-${slug}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="p-4 bg-white rounded-2xl shadow-sm">
        <QRCodeCanvas
          value={propertyUrl}
          size={180}
          level="H"
          includeMargin={false}
          data-qr-canvas
          imageSettings={{
            src: '/favicon.svg',
            x: undefined,
            y: undefined,
            height: 30,
            width: 30,
            excavate: true,
          }}
        />
      </div>
      <p className="text-xs text-dark-400 text-center break-all max-w-[200px]">{propertyUrl}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {t('common.download')} QR
      </Button>
    </div>
  );
}
