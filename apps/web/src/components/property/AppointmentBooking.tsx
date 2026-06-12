import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Calendar, Phone, User, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentSchema, type AppointmentInput } from '@shared/utils/validation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface AppointmentBookingProps {
  propertyId: string;
  agentId?: string | null;
  onSuccess?: () => void;
}

export function AppointmentBooking({ propertyId, agentId, onSuccess }: AppointmentBookingProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      requester_name: user?.full_name ?? '',
      requester_phone: user?.phone ?? '',
    },
  });

  const onSubmit = async (data: AppointmentInput) => {
    if (!user) {
      toast.error(t('errors.unauthorized'));
      return;
    }

    const { error } = await supabase.from('appointments').insert({
      property_id: propertyId,
      user_id: user.id,
      agent_id: agentId,
      requester_name: data.requester_name,
      requester_phone: data.requester_phone,
      scheduled_at: data.scheduled_at,
      notes: data.notes ?? null,
      status: 'pending',
    });

    if (error) {
      toast.error(t('errors.generic'));
      return;
    }

    toast.success(t('appointment.success'));
    reset();
    onSuccess?.();
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label={t('appointment.your_name')}
        leftIcon={<User className="h-4 w-4" />}
        error={errors.requester_name?.message}
        required
        {...register('requester_name')}
      />

      <Input
        label={t('appointment.your_phone')}
        type="tel"
        leftIcon={<Phone className="h-4 w-4" />}
        error={errors.requester_phone?.message}
        required
        dir="ltr"
        {...register('requester_phone')}
      />

      <Input
        label={t('appointment.date')}
        type="datetime-local"
        leftIcon={<Calendar className="h-4 w-4" />}
        min={minDate}
        error={errors.scheduled_at?.message}
        required
        {...register('scheduled_at')}
      />

      <div>
        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
          {t('appointment.notes')}
        </label>
        <textarea
          className="input-base resize-none"
          rows={3}
          placeholder={t('appointment.notes_placeholder')}
          {...register('notes')}
        />
      </div>

      <Button type="submit" loading={isSubmitting} className="w-full">
        {t('appointment.submit')}
      </Button>
    </form>
  );
}
