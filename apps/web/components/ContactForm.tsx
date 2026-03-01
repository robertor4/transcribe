'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

interface ContactFormProps {
  locale: string;
}

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string; // Honeypot field
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export function ContactForm({ locale }: ContactFormProps) {
  const t = useTranslations('contact');

  const [formState, setFormState] = useState<FormState>('idle');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '', // Honeypot field
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  const subjectOptions = [
    { value: 'general', label: t('form.subjects.general') },
    { value: 'support', label: t('form.subjects.support') },
    { value: 'sales', label: t('form.subjects.sales') },
    { value: 'partnership', label: t('form.subjects.partnership') },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    if (!formData.subject) {
      newErrors.subject = t('validation.subjectRequired');
    }

    if (!formData.message.trim()) {
      newErrors.message = t('validation.messageRequired');
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t('validation.messageMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!turnstileToken) {
      setFormState('error');
      return;
    }

    setFormState('submitting');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          turnstileToken,
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setFormState('success');
      setFormData({ name: '', email: '', subject: '', message: '', website: '' });
      setTurnstileToken('');
    } catch (error) {
      console.error('Contact form error:', error);
      setFormState('error');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (formState === 'success') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {t('success.title')}
        </h3>
        <p className="text-white/60">
          {t('success.description')}
        </p>
        <button
          onClick={() => setFormState('idle')}
          className="mt-6 text-[#14D0DC] hover:underline text-sm font-medium"
        >
          Send another message
        </button>
      </div>
    );
  }

  if (formState === 'error') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {t('error.title')}
        </h3>
        <p className="text-white/60">
          {t('error.description')}
        </p>
        <button
          onClick={() => setFormState('idle')}
          className="mt-6 text-[#14D0DC] hover:underline text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-2">
          {t('form.name')}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={t('form.namePlaceholder')}
          className={`w-full px-4 py-3 rounded-lg border bg-white/[0.06] ${
            errors.name ? 'border-red-500' : 'border-white/10'
          } focus:ring-2 focus:ring-[#8D6AFA]/30 focus:border-[#8D6AFA] outline-none transition-colors text-white placeholder:text-white/30`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
          {t('form.email')}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder={t('form.emailPlaceholder')}
          className={`w-full px-4 py-3 rounded-lg border bg-white/[0.06] ${
            errors.email ? 'border-red-500' : 'border-white/10'
          } focus:ring-2 focus:ring-[#8D6AFA]/30 focus:border-[#8D6AFA] outline-none transition-colors text-white placeholder:text-white/30`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-400">{errors.email}</p>
        )}
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-white/70 mb-2">
          {t('form.subject')}
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          className={`w-full px-4 py-3 rounded-lg border bg-white/[0.06] ${
            errors.subject ? 'border-red-500' : 'border-white/10'
          } focus:ring-2 focus:ring-[#8D6AFA]/30 focus:border-[#8D6AFA] outline-none transition-colors text-white [&>option]:bg-[#23194B] [&>option]:text-white`}
        >
          <option value="" className="text-white/30">{t('form.subjectPlaceholder')}</option>
          {subjectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.subject && (
          <p className="mt-1 text-sm text-red-400">{errors.subject}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-white/70 mb-2">
          {t('form.message')}
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder={t('form.messagePlaceholder')}
          rows={5}
          className={`w-full px-4 py-3 rounded-lg border bg-white/[0.06] ${
            errors.message ? 'border-red-500' : 'border-white/10'
          } focus:ring-2 focus:ring-[#8D6AFA]/30 focus:border-[#8D6AFA] outline-none transition-colors resize-none text-white placeholder:text-white/30`}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-400">{errors.message}</p>
        )}
      </div>

      {/* Honeypot field - hidden from users, catches bots */}
      <input
        type="text"
        name="website"
        value={formData.website}
        onChange={handleChange}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* Turnstile CAPTCHA */}
      <div className="flex justify-center">
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
          onSuccess={setTurnstileToken}
          onError={() => setTurnstileToken('')}
          onExpire={() => setTurnstileToken('')}
          options={{ theme: 'dark' }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={formState === 'submitting'}
        className="w-full py-3.5 px-6 rounded-full text-center font-medium bg-[#8D6AFA] text-white hover:bg-[#7A5AE0] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {formState === 'submitting' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('form.submitting')}
          </>
        ) : (
          t('form.submit')
        )}
      </button>
    </form>
  );
}
