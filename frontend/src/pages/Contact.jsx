import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { API } from '../lib/api.js';

const SUBJECTS = [
  { value: '',        label: 'انتخاب کنید' },
  { value: 'order',   label: 'پیگیری سفارش' },
  { value: 'return',  label: 'بازگشت کالا' },
  { value: 'product', label: 'سوال درباره محصول' },
  { value: 'other',   label: 'سایر' },
];

export default function Contact() {
  const { showToast } = useApp();

  const [form, setForm] = useState({
    name: '', phone: '', email: '', subject: '', message: '',
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'این فیلد الزامی است.';
    if (!form.email.trim()) next.email = 'این فیلد الزامی است.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'ایمیل معتبر نیست.';
    if (!form.subject) next.subject = 'این فیلد الزامی است.';
    if (!form.message.trim()) next.message = 'این فیلد الزامی است.';

    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await API.sendContact({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        subject: form.subject,
        message: form.message.trim(),
      });
      setForm({ name: '', phone: '', email: '', subject: '', message: '' });
      setSuccess(true);
      showToast('پیام شما ارسال شد.');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      showToast(err.message || 'خطا در ارسال پیام.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <section className="bg-stone-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-3">
            تماس با ما
          </h1>
          <p className="text-stone-500 max-w-lg mx-auto">
            سوال، پیشنهاد یا پیگیری سفارش — ما اینجاییم.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
                <h2 className="font-bold text-lg">راه‌های ارتباطی</h2>
                <InfoRow
                  icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  title="آدرس"
                  content={<p className="text-stone-500 mt-0.5">تهران، خیابان ولیعصر، پلاک ۱۲۳۴</p>}
                />
                <InfoRow
                  icon="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  title="تلفن پشتیبانی"
                  content={
                    <>
                      <a href="tel:+982112345678" className="text-stone-500 mt-0.5 block hover:text-brand-600">
                        ۰۲۱-۱۲۳۴۵۶۷۸
                      </a>
                      <p className="text-xs text-stone-400 mt-1">شنبه تا پنج‌شنبه ۹ تا ۱۸</p>
                    </>
                  }
                />
                <InfoRow
                  icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  title="ایمیل"
                  content={
                    <>
                      <a href="mailto:info@vitrin.ir" className="text-stone-500 hover:text-brand-600">
                        info@vitrin.ir
                      </a>
                      <br />
                      <a href="mailto:support@vitrin.ir" className="text-stone-500 hover:text-brand-600 text-xs">
                        support@vitrin.ir
                      </a>
                    </>
                  }
                />
              </div>

              <div className="bg-brand-50 rounded-2xl p-5 text-sm">
                <p className="font-medium mb-1">پیگیری سفارش</p>
                <p className="text-stone-600 text-xs leading-relaxed">
                  کد سفارش خود را در پیام یا ایمیل ذکر کنید تا سریع‌تر راهنمایی شوید. همچنین می‌توانید از{' '}
                  <Link to="/faq" className="text-brand-600 hover:underline">
                    سوالات متداول
                  </Link>{' '}
                  استفاده کنید.
                </p>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-2">فرم پیام</h2>
                <p className="text-sm text-stone-500 mb-6">معمولاً ظرف یک روز کاری پاسخ می‌دهیم.</p>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">نام و نام خانوادگی *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                        placeholder="نام شما"
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">شماره تماس</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                        placeholder="۰۹۱۲..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">ایمیل *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                      placeholder="email@example.com"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">موضوع *</label>
                    <select
                      value={form.subject}
                      onChange={(e) => update('subject', e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">پیام *</label>
                    <textarea
                      rows={5}
                      value={form.message}
                      onChange={(e) => update('message', e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500 resize-none"
                      placeholder="پیام خود را بنویسید..."
                    />
                    {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'در حال ارسال...' : 'ارسال پیام'}
                  </button>
                </form>

                {success && (
                  <p className="mt-4 text-sm text-green-600">
                    پیام شما ثبت شد. به‌زودی پاسخ می‌دهیم.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16 lg:pb-24">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold mb-4">موقعیت ما روی نقشه</h2>
          <p className="text-sm text-stone-500 mb-4">
            تهران، خیابان ولیعصر — نزدیک به میدان ولیعصر
          </p>
          <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm aspect-[16/9] sm:aspect-[21/9] bg-stone-100">
            <iframe
              title="نقشه فروشگاه ویترین"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.openstreetmap.org/export/embed.html?bbox=51.405%2C35.715%2C51.425%2C35.730&amp;layer=mapnik&amp;marker=35.722%2C51.415"
              allowFullScreen
            />
          </div>
          <p className="mt-3 text-xs text-stone-400">
            <a
              href="https://www.openstreetmap.org/?mlat=35.722&amp;mlon=51.415#map=16/35.722/51.415"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-600 underline"
            >
              مشاهده در OpenStreetMap
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

function InfoRow({ icon, title, content }) {
  return (
    <div className="flex gap-3 text-sm">
      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
        </svg>
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        {content}
      </div>
    </div>
  );
}