import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { toPersianDigits } from '../lib/api.js';

const NAV = [
  { to: '/',                   label: 'صفحه اصلی' },
  { to: '/shop',               label: 'فروشگاه' },
  { to: '/shop?filter=newest', label: 'جدیدترین‌ها' },
  { to: '/shop?filter=sale',   label: 'تخفیف‌ها', color: 'text-brand-600' },
  { to: '/contact',            label: 'تماس با ما' },
];

function isRouteActive(location, to) {
  const [path, qs] = to.split('?');
  if (path !== location.pathname) return false;
  const have = new URLSearchParams(location.search);
  if (!qs) return have.size === 0;
  const want = new URLSearchParams(qs);
  if (want.size !== have.size) return false;
  for (const [k, v] of want) if (have.get(k) !== v) return false;
  return true;
}

export default function Header({ onOpenDrawer }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, wishlistIds, user } = useApp();

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cartCount = cart.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0;
  const wishCount = wishlistIds.size;

  const handleSearch = (value) => {
    setSearchValue(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const q = value.trim();
      if (q) navigate(`/shop?search=${encodeURIComponent(q)}`);
    }, 400);
  };

  const navClass = (item) =>
    `nav-link${isRouteActive(location, item.to) ? ' active' : ''} ` +
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${item.color || ''}`;

  const headerClass =
    'sticky top-0 z-50 bg-white/90 backdrop-blur-md ' +
    'border-b border-stone-200 transition-all duration-300 ' +
    (scrolled ? 'shadow-sm' : '');

  return (
    <header id="main-header" className={headerClass}>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Mobile Menu Button */}
          <button
            id="mobile-menu-btn"
            onClick={onOpenDrawer}
            className="lg:hidden p-2 rounded-lg hover:bg-stone-100 transition-colors"
            aria-label="منوی موبایل"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo - بزرگ‌تر */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <img
              src="/logo.png"
              alt="ویترین"
              className="h-12 sm:h-14 lg:h-16 w-auto object-contain"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-xl lg:text-2xl font-bold tracking-tight text-stone-900 group-hover:text-brand-600 transition-colors">
                ویترین
              </span>
              <span className="text-[10px] lg:text-xs text-stone-500 tracking-widest">
                استایل برای هر لحظه
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="منوی اصلی">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className={navClass(item)}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Desktop Search */}
            <div className="hidden md:flex items-center relative">
              <input
                type="search"
                id="desktop-search"
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="دنبال چه چیزی می‌گردید؟"
                className="w-48 lg:w-64 xl:w-72 pr-10 pl-4 py-2 text-sm bg-stone-100 border border-transparent focus:border-brand-400 rounded-full outline-none transition-all placeholder:text-stone-400"
                aria-label="جستجو"
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Mobile Search Button */}
            <button
              id="mobile-search-btn"
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label="جستجو"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              id="wishlist-btn"
              className="relative p-2 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label="علاقه‌مندی‌ها"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-brand-600 rounded-full">
                  {toPersianDigits(wishCount)}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              id="cart-btn"
              className="relative p-2 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label="سبد خرید"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-brand-600 rounded-full">
                  {toPersianDigits(cartCount)}
                </span>
              )}
            </Link>

            {/* Account - همیشه دیده می‌شود */}
            <Link
              to={user ? '/dashboard' : '/login'}
              id="account-link"
              className="p-2 rounded-lg hover:bg-stone-100 transition-colors flex items-center"
              aria-label="حساب کاربری"
              title="حساب کاربری"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="absolute inset-x-0 top-full bg-white border-b border-stone-200 p-4 shadow-lg z-50">
          <div className="relative">
            <input
              type="search"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="دنبال چه چیزی می‌گردید؟"
              className="w-full pr-10 pl-10 py-3 text-sm bg-stone-100 border border-transparent focus:border-brand-400 rounded-xl outline-none"
              aria-label="جستجو"
              autoFocus
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              aria-label="بستن"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
