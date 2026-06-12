// ============================================================
// Domain Types — derived from database schema
// ============================================================

export type ListingType = 'sale' | 'rent';
export type PropertyStatus = 'available' | 'sold' | 'rented' | 'draft';
export type UserRole = 'user' | 'agent' | 'admin';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type LocationType = 'country' | 'city' | 'district';
export type Language = 'ar' | 'en';
export type PricePeriod = 'monthly' | 'yearly' | 'daily';
export type AnalyticsEvent = 'whatsapp_click' | 'share';

export interface User {
  id: string;
  full_name: string;
  full_name_ar?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  preferred_language: Language;
  expo_push_token?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  type: LocationType;
  parent_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
  sort_order: number;
  children?: Location[];
  parent?: Location;
}

export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  icon?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  storage_path: string;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
}

export interface PropertyVideo {
  id: string;
  property_id: string;
  video_url: string;
  title_ar?: string | null;
  title_en?: string | null;
  created_at: string;
}

export interface Property {
  id: string;
  title_ar: string;
  title_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  slug: string;
  category_id?: string | null;
  location_id?: string | null;
  address_ar?: string | null;
  address_en?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  listing_type: ListingType;
  status: PropertyStatus;
  price: number;
  price_period?: PricePeriod | null;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floors?: number | null;
  floor_number?: number | null;
  parking_spaces?: number | null;
  is_featured: boolean;
  is_furnished: boolean;
  amenities: string[];
  agent_id?: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyWithRelations extends Property {
  category?: Category | null;
  location?: Location | null;
  images: PropertyImage[];
  videos: PropertyVideo[];
  agent?: User | null;
}

export interface PropertyFilters {
  category_id?: string;
  location_id?: string;
  listing_type?: ListingType;
  status?: PropertyStatus;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  bedrooms?: number;
  bathrooms?: number;
  is_featured?: boolean;
  search?: string;
  sort_by?: 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'views';
  page?: number;
  per_page?: number;
}

export interface Appointment {
  id: string;
  property_id: string;
  user_id: string;
  agent_id?: string | null;
  requester_name: string;
  requester_phone: string;
  scheduled_at: string;
  status: AppointmentStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  property?: PropertyWithRelations;
  user?: User;
  agent?: User | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title_ar: string;
  title_en?: string | null;
  body_ar?: string | null;
  body_en?: string | null;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  property?: PropertyWithRelations;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name_ar?: string | null;
  name_en?: string | null;
  filters: PropertyFilters;
  created_at: string;
}

export interface PropertyAnalytics {
  property_id: string;
  whatsapp_clicks: number;
  share_count: number;
  updated_at: string;
}

export interface PropertyAnalyticsFull {
  total_views: number;
  favorites_count: number;
  appointments_count: number;
  whatsapp_clicks: number;
  share_count: number;
  views_last_30_days: number;
}

export interface DashboardStats {
  total_properties: number;
  featured_properties: number;
  sold_properties: number;
  rented_properties: number;
  available_properties: number;
  total_users: number;
  total_appointments: number;
  pending_appointments: number;
  total_views: number;
  new_properties_this_month: number;
  new_users_this_month: number;
}

export interface ComparisonItem {
  property_id: string;
  slug: string;
}
