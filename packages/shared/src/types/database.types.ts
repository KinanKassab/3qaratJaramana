// ============================================================
// Database Types — auto-generated from Supabase schema
// Regenerate with: pnpm types:gen
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          full_name_ar: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: string;
          preferred_language: string;
          expo_push_token: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          full_name_ar?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: string;
          preferred_language?: string;
          expo_push_token?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          full_name_ar?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: string;
          preferred_language?: string;
          expo_push_token?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string;
          slug: string;
          type: string;
          parent_id: string | null;
          latitude: number | null;
          longitude: number | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en: string;
          slug: string;
          type: string;
          parent_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name_ar?: string;
          name_en?: string;
          slug?: string;
          type?: string;
          parent_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      categories: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string;
          slug: string;
          icon: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en: string;
          slug: string;
          icon?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name_ar?: string;
          name_en?: string;
          slug?: string;
          icon?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      properties: {
        Row: {
          id: string;
          title_ar: string;
          title_en: string | null;
          description_ar: string | null;
          description_en: string | null;
          slug: string;
          category_id: string | null;
          location_id: string | null;
          address_ar: string | null;
          address_en: string | null;
          latitude: number | null;
          longitude: number | null;
          listing_type: string;
          status: string;
          price: number;
          price_period: string | null;
          area: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          floors: number | null;
          floor_number: number | null;
          parking_spaces: number | null;
          is_featured: boolean;
          is_furnished: boolean;
          amenities: Json;
          agent_id: string | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          listing_type: string;
          status?: string;
          price: number;
          price_period?: string | null;
          area?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          floors?: number | null;
          floor_number?: number | null;
          parking_spaces?: number | null;
          is_featured?: boolean;
          is_furnished?: boolean;
          amenities?: Json;
          agent_id?: string | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title_ar?: string;
          title_en?: string | null;
          description_ar?: string | null;
          description_en?: string | null;
          slug?: string;
          category_id?: string | null;
          location_id?: string | null;
          address_ar?: string | null;
          address_en?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          listing_type?: string;
          status?: string;
          price?: number;
          price_period?: string | null;
          area?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          floors?: number | null;
          floor_number?: number | null;
          parking_spaces?: number | null;
          is_featured?: boolean;
          is_furnished?: boolean;
          amenities?: Json;
          agent_id?: string | null;
          view_count?: number;
          updated_at?: string;
        };
      };
      property_images: {
        Row: {
          id: string;
          property_id: string;
          url: string;
          storage_path: string;
          is_cover: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          url: string;
          storage_path: string;
          is_cover?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          url?: string;
          storage_path?: string;
          is_cover?: boolean;
          sort_order?: number;
        };
      };
      property_videos: {
        Row: {
          id: string;
          property_id: string;
          video_url: string;
          title_ar: string | null;
          title_en: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          video_url: string;
          title_ar?: string | null;
          title_en?: string | null;
          created_at?: string;
        };
        Update: {
          video_url?: string;
          title_ar?: string | null;
          title_en?: string | null;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      appointments: {
        Row: {
          id: string;
          property_id: string;
          user_id: string;
          agent_id: string | null;
          requester_name: string;
          requester_phone: string;
          scheduled_at: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          user_id: string;
          agent_id?: string | null;
          requester_name: string;
          requester_phone: string;
          scheduled_at: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          agent_id?: string | null;
          requester_name?: string;
          requester_phone?: string;
          scheduled_at?: string;
          status?: string;
          notes?: string | null;
          updated_at?: string;
        };
      };
      property_views: {
        Row: {
          id: string;
          property_id: string;
          user_id: string | null;
          session_id: string | null;
          device_hash: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          user_id?: string | null;
          session_id?: string | null;
          device_hash?: string | null;
          viewed_at?: string;
        };
        Update: Record<string, never>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title_ar: string;
          title_en: string | null;
          body_ar: string | null;
          body_en: string | null;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: string;
          title_ar: string;
          title_en?: string | null;
          body_ar?: string | null;
          body_en?: string | null;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
      property_analytics: {
        Row: {
          id: string;
          property_id: string;
          whatsapp_clicks: number;
          share_count: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          whatsapp_clicks?: number;
          share_count?: number;
          updated_at?: string;
        };
        Update: {
          whatsapp_clicks?: number;
          share_count?: number;
          updated_at?: string;
        };
      };
      saved_searches: {
        Row: {
          id: string;
          user_id: string;
          name_ar: string | null;
          name_en: string | null;
          filters: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name_ar?: string | null;
          name_en?: string | null;
          filters: Json;
          created_at?: string;
        };
        Update: {
          name_ar?: string | null;
          name_en?: string | null;
          filters?: Json;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_dashboard_stats: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_property_analytics: {
        Args: { p_property_id: string };
        Returns: Json;
      };
      get_nearby_properties: {
        Args: {
          p_lat: number;
          p_lng: number;
          p_radius_km?: number;
          p_limit?: number;
          p_exclude_id?: string;
        };
        Returns: { id: string; distance_km: number }[];
      };
      increment_view_count: {
        Args: { p_property_id: string };
        Returns: null;
      };
      increment_analytics: {
        Args: { p_property_id: string; p_event_type: string };
        Returns: null;
      };
      get_property_views_per_day: {
        Args: { p_property_id: string; p_days?: number };
        Returns: { view_date: string; view_count: number }[];
      };
      get_most_viewed_properties: {
        Args: { p_limit?: number };
        Returns: { property_id: string; title_ar: string; slug: string; view_count: number }[];
      };
    };
    Enums: Record<string, never>;
  };
}
