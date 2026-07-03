import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    email: z.string().email('البريد الإلكتروني غير صالح'),
    phone: z.string().optional(),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    confirm_password: z.string(),
    preferred_language: z.enum(['ar', 'en']).default('ar'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirm_password'],
  });

export const userProfileSchema = z.object({
  full_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  full_name_ar: z.string().optional(),
  phone: z.string().optional(),
  preferred_language: z.enum(['ar', 'en']),
});

export const appointmentSchema = z.object({
  requester_name: z.string().min(2, 'يرجى إدخال اسمك الكامل'),
  requester_phone: z.string().min(9, 'يرجى إدخال رقم هاتف صالح'),
  scheduled_at: z.string().min(1, 'يرجى اختيار التاريخ والوقت'),
  notes: z.string().optional(),
});

export const propertySchema = z.object({
  title_ar: z.string().min(5, 'العنوان بالعربية يجب أن يكون 5 أحرف على الأقل'),
  title_en: z.string().optional(),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  location_id: z.string().uuid('يرجى اختيار الموقع'),
  address_ar: z.string().optional(),
  address_en: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  listing_type: z.enum(['sale', 'rent']),
  status: z.enum(['available', 'sold', 'rented', 'draft']).default('available'),
  price: z.number().positive('يرجى إدخال سعر صالح'),
  currency: z.enum(['SYP', 'USD']).default('SYP'),
  price_period: z.enum(['monthly', 'yearly', 'daily']).optional().nullable(),
  area: z.number().positive().optional().nullable(),
  bedrooms: z.number().int().min(0).optional().nullable(),
  bathrooms: z.number().int().min(0).optional().nullable(),
  floors: z.number().int().min(0).optional().nullable(),
  floor_number: z.number().int().min(0).optional().nullable(),
  parking_spaces: z.number().int().min(0).optional().nullable(),
  is_furnished: z.boolean().default(false),
  amenities: z.array(z.string()).default([]),
});

export const savedSearchSchema = z.object({
  name_ar: z.string().optional(),
  name_en: z.string().optional(),
  filters: z.record(z.unknown()),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
