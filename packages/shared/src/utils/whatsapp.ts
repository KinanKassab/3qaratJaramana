import type { PropertyWithRelations, Language } from '../types/app.types';
import { formatPrice, getLocalizedText } from './format';

export function buildWhatsAppLink(
  property: PropertyWithRelations,
  lang: Language,
  appUrl: string
): string {
  const url = `${appUrl}/property/${property.slug}`;
  const title = getLocalizedText(property.title_ar, property.title_en, lang);
  const price = formatPrice(property.price, lang, 'SYP', property.price_period);
  const listingType = property.listing_type === 'sale'
    ? (lang === 'ar' ? 'للبيع' : 'For Sale')
    : (lang === 'ar' ? 'للإيجار' : 'For Rent');

  const message = lang === 'ar'
    ? `🏠 *${title}*\n\n${listingType}\n💰 السعر: ${price}\n\n🔗 ${url}`
    : `🏠 *${title}*\n\n${listingType}\n💰 Price: ${price}\n\n🔗 ${url}`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppContactLink(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? `963${cleanPhone.slice(1)}` : cleanPhone;
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${formattedPhone}${query}`;
}
