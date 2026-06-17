import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, X, Grip, Plus, Trash2, Video,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { propertySchema } from '@shared/utils/validation';
import { uploadPropertyImage, deletePropertyImage } from '@/services/storage';
import { Spinner } from '@/components/ui/Spinner';
import type { z } from 'zod';

type FormValues = z.infer<typeof propertySchema>;

const AMENITY_OPTIONS = [
  { key: 'parking', ar: 'موقف سيارة', en: 'Parking' },
  { key: 'elevator', ar: 'مصعد', en: 'Elevator' },
  { key: 'balcony', ar: 'شرفة', en: 'Balcony' },
  { key: 'gym', ar: 'صالة رياضية', en: 'Gym' },
  { key: 'pool', ar: 'مسبح', en: 'Pool' },
  { key: 'security', ar: 'أمن', en: 'Security' },
  { key: 'generator', ar: 'مولّد', en: 'Generator' },
  { key: 'air_conditioning', ar: 'تكييف', en: 'A/C' },
  { key: 'storage', ar: 'مستودع', en: 'Storage' },
  { key: 'garden', ar: 'حديقة', en: 'Garden' },
  { key: 'furnished', ar: 'مفروشة', en: 'Furnished' },
  { key: 'internet', ar: 'إنترنت', en: 'Internet' },
];

interface ImageItem {
  url: string;
  path: string;
  is_cover: boolean;
  sort_order: number;
  id?: string;
}

export function PropertyFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useUIStore();
  const { user } = useAuthStore();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>(['']);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState('');
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    setVideoUploadError('');
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', form.getValues('title_ar') || file.name);
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/upload-youtube`, {
        method: 'POST',
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setVideoUrls(prev => {
        const filtered = prev.filter(Boolean);
        return [...filtered, data.url];
      });
    } catch (err: unknown) {
      setVideoUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingVideo(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      listing_type: 'sale',
      status: 'draft',
      price: 0,
      is_featured: false,
    },
  });

  const { data: locations } = useQuery({
    queryKey: ['all-locations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('locations')
        .select('id, name_ar, name_en, type, parent_id')
        .order('type')
        .order('name_ar');
      return data ?? [];
    },
  });

  const { data: existingProperty } = useQuery({
    queryKey: ['property-form', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase
        .from('properties')
        .select('*, images:property_images(*), videos:property_videos(*)')
        .eq('id', id)
        .single();
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (!existingProperty) return;
    const p = existingProperty as any;
    form.reset({
      title_ar: p.title_ar ?? '',
      title_en: p.title_en ?? '',
      description_ar: p.description_ar ?? '',
      description_en: p.description_en ?? '',
      address_ar: p.address_ar ?? '',
      address_en: p.address_en ?? '',
      price: p.price ?? 0,
      area: p.area ?? undefined,
      bedrooms: p.bedrooms ?? undefined,
      bathrooms: p.bathrooms ?? undefined,
      floor_number: p.floor_number ?? undefined,
      listing_type: p.listing_type ?? 'sale',
      status: p.status ?? 'draft',
      category_id: p.category_id ?? '',
      location_id: p.location_id ?? '',
      latitude: p.latitude ?? undefined,
      longitude: p.longitude ?? undefined,
      is_featured: p.is_featured ?? false,
      price_period: p.price_period ?? undefined,
    });
    if (p.images) {
      setImages(p.images.sort((a: any, b: any) => a.sort_order - b.sort_order).map((img: any) => ({
        url: img.url,
        path: img.storage_path ?? '',
        is_cover: img.is_cover,
        sort_order: img.sort_order,
        id: img.id,
      })));
    }
    if (p.videos?.length) {
      setVideoUrls(p.videos.map((v: any) => v.video_url));
    }
    if (p.amenities) setSelectedAmenities(p.amenities);
  }, [existingProperty]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    onDrop: async (files) => {
      setUploadingImages(true);
      const propertyId = id ?? 'temp-' + Date.now();
      const uploaded: ImageItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const result = await uploadPropertyImage(files[i], propertyId);
        if (result) {
          uploaded.push({
            url: result.url,
            path: result.path,
            is_cover: images.length === 0 && i === 0,
            sort_order: images.length + i,
          });
        }
      }
      setImages((prev) => [...prev, ...uploaded]);
      setUploadingImages(false);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        amenities: selectedAmenities,
        agent_id: user?.id,
      };

      let propertyId = id;
      const db = supabase as any;
      if (isEditing) {
        await db.from('properties').update(payload).eq('id', id!);
      } else {
        const { data } = await db.from('properties').insert(payload).select('id').single();
        propertyId = data?.id;
      }

      if (!propertyId) throw new Error('Failed to save property');

      if (images.length > 0) {
        if (isEditing) {
          await supabase.from('property_images').delete().eq('property_id', propertyId);
        }
        await db.from('property_images').insert(
          images.map((img, idx) => ({
            property_id: propertyId,
            url: img.url,
            storage_path: img.path,
            is_cover: idx === 0,
            sort_order: idx,
          }))
        );
      }

      const filteredVideos = videoUrls.filter(Boolean);
      if (filteredVideos.length > 0) {
        if (isEditing) {
          await supabase.from('property_videos').delete().eq('property_id', propertyId);
        }
        await db.from('property_videos').insert(
          filteredVideos.map((url) => ({ property_id: propertyId, video_url: url }))
        );
      }

      return propertyId;
    },
    onSuccess: (propertyId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      navigate('/properties');
    },
  });

  const cities = locations?.filter((l: any) => l.type === 'city') ?? [];
  const districts = locations?.filter((l: any) => l.type === 'district') ?? [];
  const selectedLocation = form.watch('location_id');
  const listingType = form.watch('listing_type');

  const formLabel = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">
          {isEditing
            ? formLabel('تعديل العقار', 'Edit Property')
            : formLabel('إضافة عقار جديد', 'Add New Property')}
        </h1>
      </div>

      <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-8">
        {/* Basic Info */}
        <div className="card space-y-5">
          <h2 className="font-semibold text-dark-900 dark:text-dark-100 text-base border-b border-dark-100 dark:border-dark-700 pb-3">
            {formLabel('المعلومات الأساسية', 'Basic Information')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('العنوان بالعربية', 'Title in Arabic')}</label>
              <input {...form.register('title_ar')} className="input-base" dir="rtl" />
              {form.formState.errors.title_ar && <p className="text-red-500 text-xs mt-1">{form.formState.errors.title_ar.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('العنوان بالإنجليزية', 'Title in English')}</label>
              <input {...form.register('title_en')} className="input-base" dir="ltr" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('الوصف بالعربية', 'Description in Arabic')}</label>
              <textarea {...form.register('description_ar')} rows={4} className="input-base resize-none" dir="rtl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('الوصف بالإنجليزية', 'Description in English')}</label>
              <textarea {...form.register('description_en')} rows={4} className="input-base resize-none" dir="ltr" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('العنوان التفصيلي (ع)', 'Address (AR)')}</label>
              <input {...form.register('address_ar')} className="input-base" dir="rtl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('العنوان التفصيلي (ع+إن)', 'Address (EN)')}</label>
              <input {...form.register('address_en')} className="input-base" dir="ltr" />
            </div>
          </div>
        </div>

        {/* Pricing & Type */}
        <div className="card space-y-5">
          <h2 className="font-semibold text-dark-900 dark:text-dark-100 text-base border-b border-dark-100 dark:border-dark-700 pb-3">
            {formLabel('التسعير والنوع', 'Pricing & Type')}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5">{formLabel('السعر', 'Price')}</label>
              <input {...form.register('price', { valueAsNumber: true })} type="number" className="input-base" dir="ltr" />
              {form.formState.errors.price && <p className="text-red-500 text-xs mt-1">{form.formState.errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('نوع الإعلان', 'Listing Type')}</label>
              <select {...form.register('listing_type')} className="input-base">
                <option value="sale">{formLabel('بيع', 'Sale')}</option>
                <option value="rent">{formLabel('إيجار', 'Rent')}</option>
              </select>
            </div>

            {listingType === 'rent' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">{formLabel('فترة الإيجار', 'Rent Period')}</label>
                <select {...form.register('price_period')} className="input-base">
                  <option value="monthly">{formLabel('شهري', 'Monthly')}</option>
                  <option value="yearly">{formLabel('سنوي', 'Yearly')}</option>
                  <option value="daily">{formLabel('يومي', 'Daily')}</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('الحالة', 'Status')}</label>
              <select {...form.register('status')} className="input-base">
                <option value="draft">{formLabel('مسودة', 'Draft')}</option>
                <option value="available">{formLabel('متاح', 'Available')}</option>
                <option value="sold">{formLabel('مباع', 'Sold')}</option>
                <option value="rented">{formLabel('مؤجر', 'Rented')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('المساحة (م²)', 'Area (m²)')}</label>
              <input {...form.register('area', { valueAsNumber: true })} type="number" className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('غرف النوم', 'Bedrooms')}</label>
              <input {...form.register('bedrooms', { valueAsNumber: true })} type="number" className="input-base" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('الحمامات', 'Bathrooms')}</label>
              <input {...form.register('bathrooms', { valueAsNumber: true })} type="number" className="input-base" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('الطابق', 'Floor')}</label>
              <input {...form.register('floor_number', { valueAsNumber: true })} type="number" className="input-base" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_featured"
              {...form.register('is_featured')}
              className="w-4 h-4 rounded text-primary-500"
            />
            <label htmlFor="is_featured" className="text-sm font-medium">
              {formLabel('عقار مميز', 'Featured Property')}
            </label>
          </div>
        </div>

        {/* Location */}
        <div className="card space-y-5">
          <h2 className="font-semibold text-dark-900 dark:text-dark-100 text-base border-b border-dark-100 dark:border-dark-700 pb-3">
            {formLabel('الموقع', 'Location')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('المدينة', 'City')}</label>
              <select
                onChange={(e) => form.setValue('location_id', e.target.value)}
                className="input-base"
              >
                <option value="">{formLabel('اختر المدينة', 'Select City')}</option>
                {cities.map((c: any) => (
                  <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name_en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{formLabel('المنطقة', 'District')}</label>
              <select {...form.register('location_id')} className="input-base">
                <option value="">{formLabel('اختر المنطقة', 'Select District')}</option>
                {districts.map((d: any) => (
                  <option key={d.id} value={d.id}>{language === 'ar' ? d.name_ar : d.name_en}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-dark-900 dark:text-dark-100 text-base border-b border-dark-100 dark:border-dark-700 pb-3">
            {formLabel('المميزات', 'Amenities')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {AMENITY_OPTIONS.map((amenity) => (
              <label key={amenity.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity.key)}
                  onChange={(e) => {
                    setSelectedAmenities(prev =>
                      e.target.checked
                        ? [...prev, amenity.key]
                        : prev.filter(a => a !== amenity.key)
                    );
                  }}
                  className="w-4 h-4 rounded text-primary-500"
                />
                <span className="text-sm">{language === 'ar' ? amenity.ar : amenity.en}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-dark-900 dark:text-dark-100 text-base border-b border-dark-100 dark:border-dark-700 pb-3">
            {formLabel('الصور', 'Images')}
          </h2>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                : 'border-dark-300 dark:border-dark-600 hover:border-primary-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 text-dark-400 mx-auto mb-3" />
            <p className="text-dark-600 dark:text-dark-400 text-sm">
              {uploadingImages
                ? formLabel('جارٍ الرفع...', 'Uploading...')
                : formLabel('اسحب الصور هنا أو انقر للاختيار', 'Drag images here or click to select')}
            </p>
            <p className="text-dark-400 text-xs mt-1">{formLabel('JPG, PNG, WebP — حد أقصى 10MB', 'JPG, PNG, WebP — max 10MB')}</p>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img.url}
                    className={`w-full aspect-square object-cover rounded-xl ${idx === 0 ? 'ring-2 ring-primary-500' : ''}`}
                    alt=""
                  />
                  {idx === 0 && (
                    <span className="absolute bottom-1 start-1 text-[10px] bg-primary-500 text-white px-1 rounded">
                      {formLabel('غلاف', 'Cover')}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 end-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Videos */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-dark-900 dark:text-dark-100 text-base border-b border-dark-100 dark:border-dark-700 pb-3">
            {formLabel('الفيديوهات', 'Videos')}
          </h2>
          {videoUrls.map((url, idx) => (
            <div key={idx} className="flex gap-2">
              <div className="relative flex-1">
                <Video className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
                <input
                  value={url}
                  onChange={(e) => setVideoUrls(prev => prev.map((u, i) => i === idx ? e.target.value : u))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="input-base ps-9"
                  dir="ltr"
                />
              </div>
              <button
                type="button"
                onClick={() => setVideoUrls(prev => prev.filter((_, i) => i !== idx))}
                className="p-2 text-dark-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setVideoUrls(prev => [...prev, ''])}
              className="btn-ghost text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {formLabel('إضافة رابط', 'Add URL')}
            </button>
            <button
              type="button"
              onClick={() => videoFileInputRef.current?.click()}
              disabled={uploadingVideo}
              className="btn-ghost text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
            >
              {uploadingVideo ? (
                <><Spinner size="sm" />{formLabel('جاري الرفع...', 'Uploading...')}</>
              ) : (
                <><Upload className="h-3.5 w-3.5" />{formLabel('رفع على يوتيوب', 'Upload to YouTube')}</>
              )}
            </button>
            <input
              ref={videoFileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); }}
            />
          </div>
          {videoUploadError && (
            <p className="text-red-500 text-xs">{videoUploadError}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button type="button" onClick={() => navigate('/properties')} className="btn-outline">
            {formLabel('إلغاء', 'Cancel')}
          </button>
          <button type="submit" disabled={saveMutation.isPending} className="btn-primary px-8">
            {saveMutation.isPending
              ? <Spinner size="sm" />
              : (isEditing ? formLabel('حفظ التغييرات', 'Save Changes') : formLabel('إضافة العقار', 'Add Property'))}
          </button>
        </div>

        {saveMutation.isError && (
          <p className="text-red-500 text-sm text-center">
            {formLabel('حدث خطأ أثناء الحفظ', 'Error saving property')}
          </p>
        )}
      </form>
    </div>
  );
}
