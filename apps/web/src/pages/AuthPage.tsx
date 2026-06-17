import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn, UserPlus, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { loginSchema, registerSchema } from '@shared/utils/validation';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import type { z } from 'zod';

type Tab = 'login' | 'register' | 'forgot' | 'reset';

export function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { language } = useUIStore();
  const { user, login, register } = useAuthStore();
  const [tab, setTab] = useState<Tab>(() => {
    const p = searchParams.get('tab');
    if (p === 'register' || p === 'forgot' || p === 'reset') return p;
    return 'login';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetDone, setResetDone] = useState(false);

  const from = (location.state as { from?: string })?.from ?? '/';

  useEffect(() => {
    if (user && tab !== 'reset') navigate(from, { replace: true });
  }, [user, navigate, from, tab]);

  // Listen for PASSWORD_RECOVERY event from Supabase (fired when user clicks reset link)
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    import('@/lib/supabase').then(({ supabase }) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setTab('reset');
      });
      cleanup = () => subscription.unsubscribe();
    });
    return () => { cleanup?.(); };
  }, []);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    setError('');
    try {
      await login(data.email, data.password);
    } catch {
      setError(language === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    setLoading(true);
    setError('');
    try {
      await register({ email: data.email, password: data.password, full_name: data.full_name });
    } catch {
      setError(language === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'Registration error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth?tab=reset`,
    });
    setLoading(false);
    setForgotSent(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassword !== resetConfirm) {
      setError(language === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (resetPassword.length < 6) {
      setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error: updateError } = await supabase.auth.updateUser({ password: resetPassword });
      if (updateError) throw updateError;
      setResetDone(true);
    } catch {
      setError(language === 'ar' ? 'حدث خطأ أثناء تحديث كلمة المرور' : 'Error updating password');
    } finally {
      setLoading(false);
    }
  };

  const visibleTabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'login', label: t('nav.login'), icon: LogIn },
    { id: 'register', label: t('nav.register'), icon: UserPlus },
    { id: 'forgot', label: language === 'ar' ? 'نسيت كلمة المرور' : 'Forgot Password', icon: KeyRound },
  ];

  return (
    <>
      <SEO
        title={t('nav.login')}
        url="/auth"
      />

      <div className="min-h-screen flex items-center justify-center px-4 bg-dark-50 dark:bg-dark-950 pt-16">
        <div className="w-full max-w-md">
          {/* Logo / brand */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-bold text-primary-600">عقارات جرمانا</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-card p-8">
            {/* Tabs — hidden when on reset tab */}
            {tab !== 'reset' && (
              <div className="flex gap-1 mb-8 bg-dark-100 dark:bg-dark-700 rounded-xl p-1">
                {visibleTabs.map((vt) => (
                  <button
                    key={vt.id}
                    onClick={() => { setTab(vt.id); setError(''); }}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                      ${tab === vt.id
                        ? 'bg-white dark:bg-dark-600 text-dark-900 dark:text-dark-100 shadow-sm'
                        : 'text-dark-500 dark:text-dark-400 hover:text-dark-700'
                      }
                    `}
                  >
                    <vt.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{vt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            {tab === 'login' && (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    {...loginForm.register('email')}
                    type="email"
                    className="input-base"
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    {language === 'ar' ? 'كلمة المرور' : 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      {...loginForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="input-base pe-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-dark-400"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3"
                >
                  {loading ? <Spinner size="sm" /> : t('nav.login')}
                </button>
              </form>
            )}

            {/* Register Form */}
            {tab === 'register' && (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    {...registerForm.register('full_name')}
                    type="text"
                    className="input-base"
                    placeholder={language === 'ar' ? 'محمد أحمد' : 'Mohammed Ahmad'}
                  />
                  {registerForm.formState.errors.full_name && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    {...registerForm.register('email')}
                    type="email"
                    className="input-base"
                    dir="ltr"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    {language === 'ar' ? 'كلمة المرور' : 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      {...registerForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="input-base pe-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-dark-400"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <input
                      {...registerForm.register('confirm_password')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="input-base pe-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-dark-400"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.confirm_password && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.confirm_password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3"
                >
                  {loading ? <Spinner size="sm" /> : t('nav.register')}
                </button>
              </form>
            )}

            {/* Forgot Password */}
            {tab === 'forgot' && (
              forgotSent ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="h-8 w-8 text-primary-500" />
                  </div>
                  <h3 className="font-bold text-dark-900 dark:text-dark-100 mb-2">
                    {language === 'ar' ? 'تم إرسال الرابط' : 'Link Sent'}
                  </h3>
                  <p className="text-dark-500 text-sm">
                    {language === 'ar'
                      ? `تحقق من بريدك الإلكتروني ${forgotEmail} للحصول على رابط إعادة التعيين`
                      : `Check ${forgotEmail} for the reset link`}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-dark-500 dark:text-dark-400 text-sm mb-4">
                    {language === 'ar'
                      ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور'
                      : "Enter your email and we'll send you a password reset link"}
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="input-base"
                      dir="ltr"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center py-3"
                  >
                    {loading ? <Spinner size="sm" /> : (language === 'ar' ? 'إرسال الرابط' : 'Send Reset Link')}
                  </button>
                </form>
              )
            )}

            {/* Reset Password (after clicking email link) */}
            {tab === 'reset' && (
              resetDone ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="h-8 w-8 text-primary-500" />
                  </div>
                  <h3 className="font-bold text-dark-900 dark:text-dark-100 mb-2">
                    {language === 'ar' ? 'تم تحديث كلمة المرور' : 'Password Updated'}
                  </h3>
                  <p className="text-dark-500 text-sm mb-6">
                    {language === 'ar' ? 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة' : 'You can now log in with your new password'}
                  </p>
                  <button
                    onClick={() => setTab('login')}
                    className="btn-primary justify-center px-6 py-2"
                  >
                    {language === 'ar' ? 'تسجيل الدخول' : 'Log In'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <h3 className="font-bold text-dark-900 dark:text-dark-100 mb-4 text-center">
                    {language === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set New Password'}
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                      {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className="input-base pe-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-dark-400"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                      {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={resetConfirm}
                        onChange={(e) => setResetConfirm(e.target.value)}
                        className="input-base pe-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-dark-400"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center py-3"
                  >
                    {loading ? <Spinner size="sm" /> : (language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password')}
                  </button>
                </form>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
