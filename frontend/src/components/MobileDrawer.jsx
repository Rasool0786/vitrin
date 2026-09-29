import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const DRAWER_NAV = [
  { to: '/',                   label: 'صفحه اصلی' },
  { to: '/shop',               label: 'فروشگاه' },
  { to: '/shop?filter=newest', label: 'جدیدترین‌ها' },
  { to: '/shop?filter=sale',   label: 'تخفیف‌ها', color: 'text-brand-600' },
];

const DRAWER_FOOTER = [
  { to: '/about',   label: 'درباره ما' },
  { to: '/contact', label: 'تماس با ما' },
  { to: '/faq',     label: 'سوالات متداول' },
];

export default function MobileDrawer({ open, onClose }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      <div
        id="mobile-drawer-overlay"
        onClick={onClose}
        className={
          'fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 lg:hidden ' +
          (open ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
      />

      {/* Drawer */}
      <aside
        id="mobile-drawer"
        className={
          'fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl ' +
          'transition-transform duration-300 ease-out lg:hidden flex flex-col ' +
          (open ? 'translate-x-0' : 'translate-x-full')
        }
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="ویترین" className="h-10 w-auto" />
            <div>
              <p className="text-base font-bold">ویترین</p>
              <p className="text-[10px] text-stone-500">استایل برای هر لحظه</p>
            </div>
          </div>
          <button
            id="close-drawer"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100"
            aria-label="بستن منو"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="منوی موبایل">
          {DRAWER_NAV.map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={
                i === 0
                  ? `block px-4 py-3 rounded-xl font-medium bg-stone-100 ${item.color || ''}`
                  : `block px-4 py-3 rounded-xl font-medium hover:bg-stone-100 transition-colors ${item.color || ''}`
              }
            >
              {item.label}
            </Link>
          ))}
          <hr className="my-3 border-stone-200" />
          {DRAWER_FOOTER.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="block px-4 py-3 rounded-xl font-medium hover:bg-stone-100 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Enamad in drawer (optional) */}
        <div className="p-5 border-t border-stone-200 flex items-center justify-center">
          <a
            referrerPolicy="origin"
            target="_blank"
            rel="noopener noreferrer"
            href="https://trustseal.enamad.ir/?id=YOUR_ENAMAD_ID&Code=YOUR_ENAMAD_CODE"
          >
            <img
              referrerPolicy="origin"
              src="https://trustseal.enamad.ir/logo.aspx?id=YOUR_ENAMAD_ID&Code=YOUR_ENAMAD_CODE"
              alt="نماد اعتماد الکترونیکی"
              className="h-20 w-auto"
            />
          </a>
        </div>
      </aside>
    </>
  );
}