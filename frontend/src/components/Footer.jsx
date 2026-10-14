import { Link } from 'react-router-dom';

const QUICK_LINKS = [
  { to: '/about',   label: 'درباره ما' },
  { to: '/contact', label: 'تماس با ما' },
  { to: '/terms',   label: 'قوانین و مقررات' },
  { to: '/privacy', label: 'حریم خصوصی' },
  { to: '/guide',   label: 'راهنمای خرید' },
];

const CUSTOMER_SERVICE = [
  { to: '/contact',  label: 'پیگیری سفارش' },
  { to: '/faq',      label: 'سوالات متداول' },
  { to: '/returns',  label: 'شرایط بازگشت کالا' },
  { to: '/shipping', label: 'روش‌های ارسال' },
];

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-8">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="ویترین"
                className="h-12 sm:h-14 lg:h-16 w-auto brightness-0 invert object-contain"
              />
            </Link>
            <p className="text-sm leading-relaxed text-stone-400">
              فروشگاه لباس زنانه با تمرکز بر کیفیت، سادگی و طراحی ماندگار. استایل برای هر لحظه.
            </p>
            <div className="flex gap-3 mt-5">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-stone-800 hover:bg-brand-600 flex items-center justify-center transition-colors"
                aria-label="اینستاگرام"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-stone-800 hover:bg-brand-600 flex items-center justify-center transition-colors"
                aria-label="تلگرام"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-stone-800 hover:bg-brand-600 flex items-center justify-center transition-colors"
                aria-label="توییتر"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">دسترسی سریع</h4>
            <ul className="space-y-2.5 text-sm">
              {QUICK_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">خدمات مشتریان</h4>
            <ul className="space-y-2.5 text-sm">
              {CUSTOMER_SERVICE.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">تماس با ما</h4>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li>تهران، خیابان ولیعصر، پلاک ۱۲۳۴</li>
              <li>
                <a href="tel:+982112345678" className="hover:text-white transition-colors">
                  ۰۲۱-۱۲۳۴۵۶۷۸
                </a>
              </li>
              <li>
                <a href="mailto:info@vitrin.ir" className="hover:text-white transition-colors">
                  info@vitrin.ir
                </a>
              </li>
              <li>شنبه تا پنج‌شنبه: ۹ تا ۱۸</li>
            </ul>
          </div>

          {/* Enamad */}
          <div className="flex items-start justify-center lg:justify-end">
            <a
              referrerPolicy="origin"
              target="_blank"
              rel="noopener noreferrer"
              href="https://trustseal.enamad.ir/?id=YOUR_ENAMAD_ID&Code=YOUR_ENAMAD_CODE"
              className="inline-block bg-white rounded-xl p-2 hover:opacity-90 transition-opacity"
              title="نماد اعتماد الکترونیکی"
            >
              <img
                referrerPolicy="origin"
                src="https://trustseal.enamad.ir/logo.aspx?id=YOUR_ENAMAD_ID&Code=YOUR_ENAMAD_CODE"
                alt="نماد اعتماد الکترونیکی"
                className="h-24 w-auto"
                style={{ cursor: 'pointer' }}
              />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-stone-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
          <p>© ۱۴۰۵ ویترین. تمامی حقوق محفوظ است.</p>
          <p className="text-xs">طراحی و توسعه توسط محمد رسول زمانی</p>
        </div>
      </div>
    </footer>
  );
}
