import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { formatDate } from '@shared/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';

export function NotificationsPage() {
  const { language } = useUIStore();
  const isAr = language === 'ar';
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [broadcast, setBroadcast] = useState(true);
  const [targetUserId, setTargetUserId] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: history, refetch } = useQuery({
    queryKey: ['notifications-history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, title_ar, title_en, body_ar, created_at, user_id, is_read')
        .order('created_at', { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users-simple'],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('id, full_name, email');
      return data ?? [];
    },
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr) return;
    setSending(true);

    if (broadcast) {
      const { data: allUsers } = await supabase.from('users').select('id');
      const rows = (allUsers ?? []).map((u: any) => ({
        user_id: u.id,
        title_ar: titleAr,
        title_en: titleEn,
        body_ar: bodyAr,
        body_en: bodyEn,
        type: 'broadcast',
      }));
      if (rows.length > 0) await supabase.from('notifications').insert(rows);
    } else {
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        title_ar: titleAr,
        title_en: titleEn,
        body_ar: bodyAr,
        body_en: bodyEn,
        type: 'direct',
      });
    }

    setSending(false);
    setSent(true);
    setTitleAr('');
    setTitleEn('');
    setBodyAr('');
    setBodyEn('');
    setTimeout(() => setSent(false), 3000);
    refetch();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-100">
        {isAr ? 'الإشعارات' : 'Notifications'}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="card">
          <h2 className="font-semibold text-dark-900 dark:text-dark-100 mb-5 flex items-center gap-2">
            <Send className="h-5 w-5 text-primary-500" />
            {isAr ? 'إرسال إشعار' : 'Send Notification'}
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-dark-50 dark:bg-dark-700 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={broadcast} onChange={() => setBroadcast(true)} className="text-primary-500" />
                <span className="text-sm font-medium">{isAr ? 'للجميع' : 'Broadcast'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!broadcast} onChange={() => setBroadcast(false)} className="text-primary-500" />
                <span className="text-sm font-medium">{isAr ? 'مستخدم محدد' : 'Specific User'}</span>
              </label>
            </div>

            {!broadcast && (
              <div>
                <label className="block text-sm font-medium mb-1.5">{isAr ? 'المستخدم' : 'User'}</label>
                <select value={targetUserId} onChange={e => setTargetUserId(e.target.value)} className="input-base" required={!broadcast}>
                  <option value="">{isAr ? 'اختر مستخدماً' : 'Select User'}</option>
                  {(users ?? []).map((u: any) => (
                    <option key={u.id} value={u.id}>{u.full_name} — {u.email}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">{isAr ? 'العنوان (ع)' : 'Title (AR)'}</label>
                <input value={titleAr} onChange={e => setTitleAr(e.target.value)} className="input-base" dir="rtl" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{isAr ? 'العنوان (إن)' : 'Title (EN)'}</label>
                <input value={titleEn} onChange={e => setTitleEn(e.target.value)} className="input-base" dir="ltr" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">{isAr ? 'النص (ع)' : 'Body (AR)'}</label>
                <textarea value={bodyAr} onChange={e => setBodyAr(e.target.value)} rows={3} className="input-base resize-none" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{isAr ? 'النص (إن)' : 'Body (EN)'}</label>
                <textarea value={bodyEn} onChange={e => setBodyEn(e.target.value)} rows={3} className="input-base resize-none" dir="ltr" />
              </div>
            </div>

            <button type="submit" disabled={sending} className="btn-primary w-full justify-center py-3">
              {sending ? <Spinner size="sm" /> : sent ? (isAr ? '✓ تم الإرسال' : '✓ Sent!') : (isAr ? 'إرسال الإشعار' : 'Send Notification')}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="card">
          <h2 className="font-semibold text-dark-900 dark:text-dark-100 mb-5 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary-500" />
            {isAr ? 'سجل الإشعارات' : 'Notification History'}
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {(history ?? []).map((n: any) => (
              <div key={n.id} className="p-3 rounded-xl bg-dark-50 dark:bg-dark-700">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-dark-900 dark:text-dark-100 text-sm">{n.title_ar}</p>
                  {!n.user_id && (
                    <Badge variant="info" className="flex-shrink-0 text-xs">{isAr ? 'عام' : 'Broadcast'}</Badge>
                  )}
                </div>
                <p className="text-dark-400 text-xs mt-1">{formatDate(n.created_at, language)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
