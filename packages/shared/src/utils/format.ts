import type { Language, PricePeriod } from '../types/app.types';

export function formatPrice(
  price: number,
  lang: Language,
  currency = 'SYP',
  period?: PricePeriod | null
): string {
  let formatted: string;

  try {
    formatted = new Intl.NumberFormat(lang === 'ar' ? 'ar-SY' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    formatted = `${price.toLocaleString()} ${currency}`;
  }

  if (period) {
    const periodLabels: Record<PricePeriod, Record<Language, string>> = {
      monthly: { ar: '/شهر', en: '/mo' },
      yearly: { ar: '/سنة', en: '/yr' },
      daily: { ar: '/يوم', en: '/day' },
    };
    formatted += periodLabels[period][lang];
  }

  return formatted;
}

export function formatArea(area: number, lang: Language): string {
  const formatted = new Intl.NumberFormat(lang === 'ar' ? 'ar-SY' : 'en-US').format(area);
  return `${formatted} ${lang === 'ar' ? 'م²' : 'm²'}`;
}

export function formatDate(dateString: string, lang: Language): string {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SY' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function formatRelativeDate(dateString: string, lang: Language): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return lang === 'ar' ? 'اليوم' : 'Today';
  if (diffDays === 1) return lang === 'ar' ? 'أمس' : 'Yesterday';
  if (diffDays < 7) return lang === 'ar' ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return lang === 'ar' ? `منذ ${weeks} أسبوع` : `${weeks}w ago`;
  }

  return formatDate(dateString, lang);
}

export function formatNumber(num: number, lang: Language): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SY' : 'en-US').format(num);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getLocalizedText(
  arText: string | null | undefined,
  enText: string | null | undefined,
  lang: Language
): string {
  if (lang === 'ar') return arText ?? enText ?? '';
  return enText ?? arText ?? '';
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

export function isCloudflareStreamUrl(url: string): boolean {
  return /cloudflarestream\.com|iframe\.videodelivery\.net/.test(url);
}
