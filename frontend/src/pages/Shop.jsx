import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API, toPersianDigits } from '../lib/api.js';
import ProductCard from '../components/ProductCard.jsx';

const PER_PAGE = 9;

const CATEGORIES = [
  { value: 'all',     label: 'همه' },
  { value: 'زنانه',   label: 'زنانه' },
  { value: 'مردانه',  label: 'مردانه' },
  { value: 'روزمره',  label: 'روزمره' },
  { value: 'رسمی',    label: 'رسمی' },
  { value: 'اکسسوری', label: 'اکسسوری' },
  { value: 'کفش',     label: 'کفش' },
];

const PRICE_RANGES = [
  { value: 'all',                label: 'همه قیمت‌ها' },
  { value: '0-1000000',          label: 'زیر ۱ میلیون' },
  { value: '1000000-2000000',    label: '۱ تا ۲ میلیون' },
  { value: '2000000-3000000',    label: '۲ تا ۳ میلیون' },
  { value: '3000000-99999999',   label: 'بالای ۳ میلیون' },
];

const SORT_OPTIONS = [
  { value: 'all',        label: 'پیش‌فرض' },
  { value: 'newest',     label: 'جدیدترین' },
  { value: 'bestseller', label: 'پرفروش‌ترین' },
  { value: 'cheapest',   label: 'ارزان‌ترین' },
  { value: 'expensive',  label: 'گران‌ترین' },
  { value: 'discount',   label: 'بیشترین تخفیف' },
];

export default function Shop() {
  const [searchParams] = useSearchParams();

  const [currentCat, setCurrentCat]           = useState(searchParams.get('cat') || 'all');
  const [currentSort, setCurrentSort]         = useState('all');
  const [currentPrice, setCurrentPrice]       = useState('all');
  const [onlySale, setOnlySale]               = useState(searchParams.get('filter') === 'sale');
  const [onlyNew, setOnlyNew]                 = useState(searchParams.get('filter') === 'newest');
  const [onlyBestseller, setOnlyBestseller]   = useState(searchParams.get('filter') === 'bestseller');
  const [searchQuery, setSearchQuery]         = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage]         = useState(Math.max(1, Number(searchParams.get('page')) || 1));

  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const searchDebounce = useRef(null);

  useEffect(() => {
    setCurrentCat(searchParams.get('cat') || 'all');
    setSearchQuery(searchParams.get('search') || '');
    setOnlySale(searchParams.get('filter') === 'sale');
    setOnlyNew(searchParams.get('filter') === 'newest');
    setOnlyBestseller(searchParams.get('filter') === 'bestseller');
    setCurrentPage(Math.max(1, Number(searchParams.get('page')) || 1));
  }, [searchParams]);

  const buildParams = useCallback(() => {
    const params = { page: currentPage };
    if (currentCat !== 'all') params.category = currentCat;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (currentPrice !== 'all') {
      const [min, max] = currentPrice.split('-');
      params.min_price = min;
      params.max_price = max;
    }
    if (onlySale) params.has_discount = true;
    if (onlyNew) params.is_new = true;
    if (onlyBestseller) params.is_bestseller = true;

    switch (currentSort) {
      case 'newest':     params.ordering = '-datetime_created'; break;
      case 'bestseller': params.ordering = '-comments_count';   break;
      case 'cheapest':   params.ordering = 'price';             break;
      case 'expensive':  params.ordering = '-price';            break;
      case 'discount':   params.ordering = '-discount';         break;
    }
    return params;
  }, [currentCat, currentSort, currentPrice, onlySale, onlyNew, onlyBestseller, searchQuery, currentPage]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    API.products(buildParams())
      .then((data) => {
        if (cancelled) return;
        setProducts(data.results || data);
        setTotalCount(data.count ?? (data.results || data).length);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setTotalCount(0);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [buildParams]);

  const resetAllFilters = () => {
    setCurrentCat('all');
    setCurrentSort('all');
    setCurrentPrice('all');
    setOnlySale(false);
    setOnlyNew(false);
    setOnlyBestseller(false);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / PER_PAGE) || 1;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  const getPageTitle = () => {
    if (currentCat !== 'all') return { title: currentCat, subtitle: `محصولات ${currentCat}` };
    if (onlySale) return { title: 'تخفیف‌ها', subtitle: 'محصولات با تخفیف ویژه' };
    if (onlyNew) return { title: 'جدیدترین‌ها', subtitle: 'تازه‌های ویترین' };
    return { title: 'فروشگاه', subtitle: 'همه محصولات ویترین' };
  };
  const { title, subtitle } = getPageTitle();

  const skeleton = (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-xl bg-stone-200" />
      <div className="pt-3 pb-1.5 px-1 space-y-2">
        <div className="h-3 w-16 bg-stone-200 rounded" />
        <div className="h-4 w-3/4 bg-stone-200 rounded" />
        <div className="h-4 w-24 bg-stone-200 rounded" />
      </div>
    </div>
  );

  const FiltersContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">فیلترها</h2>
        <button onClick={resetAllFilters} className="text-xs text-brand-600 hover:underline">
          پاک کردن همه
        </button>
      </div>

      <div>
        <h3 className="font-medium text-sm mb-3 text-stone-700">دسته‌بندی</h3>
        <div className="space-y-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => { setCurrentCat(c.value); setCurrentPage(1); }}
              className={
                'cat-btn w-full text-right px-3 py-2 text-sm rounded-lg transition-colors hover:bg-stone-100 ' +
                (currentCat === c.value ? 'active bg-stone-900 text-white' : '')
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-stone-200" />

      <div>
        <h3 className="font-medium text-sm mb-3 text-stone-700">محدوده قیمت</h3>
        <div className="space-y-2">
          {PRICE_RANGES.map((r) => (
            <label key={r.value} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="price"
                value={r.value}
                checked={currentPrice === r.value}
                onChange={() => { setCurrentPrice(r.value); setCurrentPage(1); }}
                className="price-radio accent-brand-600"
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-stone-200" />

      <div>
        <h3 className="font-medium text-sm mb-3 text-stone-700">ویژگی‌ها</h3>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={onlySale} onChange={(e) => { setOnlySale(e.target.checked); setCurrentPage(1); }} className="accent-brand-600 rounded" />
            <span>فقط تخفیف‌دار</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={onlyNew} onChange={(e) => { setOnlyNew(e.target.checked); setCurrentPage(1); }} className="accent-brand-600 rounded" />
            <span>فقط جدید</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={onlyBestseller} onChange={(e) => { setOnlyBestseller(e.target.checked); setCurrentPage(1); }} className="accent-brand-600 rounded" />
            <span>پرفروش‌ها</span>
          </label>
        </div>
      </div>

      <hr className="border-stone-200" />

      <div>
        <h3 className="font-medium text-sm mb-3 text-stone-700">مرتب‌سازی</h3>
        <select
          value={currentSort}
          onChange={(e) => { setCurrentSort(e.target.value); setCurrentPage(1); }}
          className="w-full px-3 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen">
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">{title}</h1>
          <p className="mt-1 text-stone-500">{subtitle}</p>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-stone-200 rounded-xl text-sm font-medium hover:bg-stone-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            فیلترها و مرتب‌سازی
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24 bg-white rounded-2xl border border-stone-200 p-5">
              <FiltersContent />
            </div>
          </aside>

          {mobileFiltersOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
              <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">فیلترها</h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-2 rounded-lg hover:bg-stone-100"
                    aria-label="بستن"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <FiltersContent />
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full mt-6 py-3.5 bg-stone-900 text-white font-medium rounded-full"
                >
                  اعمال فیلترها
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-stone-500">
                <span>{toPersianDigits(totalCount)}</span> محصول
                {totalPages > 1 && (
                  <span className="mr-2">
                    (صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)})
                  </span>
                )}
              </p>
            </div>

            {!loading && products.length === 0 && (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-medium text-stone-600">محصولی پیدا نشد.</p>
                <button onClick={resetAllFilters} className="mt-4 text-brand-600 font-medium hover:underline">
                  پاک کردن فیلترها
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {loading
                ? Array(PER_PAGE).fill(0).map((_, i) => <div key={i}>{skeleton}</div>)
                : products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>

            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-1 sm:gap-2 flex-wrap" aria-label="صفحه‌بندی">
                <button
                  disabled={currentPage === 1}
                  onClick={() => { setCurrentPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`page-btn w-10 h-10 rounded-full text-sm font-medium transition-colors ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-stone-200'}`}
                  aria-label="صفحه قبل"
                >
                  <svg className="w-4 h-4 mx-auto rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {pages.map((p, i) =>
                  p === '...' ? (
                    <span key={`e${i}`} className="w-10 h-10 flex items-center justify-center text-stone-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`page-btn w-10 h-10 rounded-full text-sm font-medium transition-colors ${p === currentPage ? 'bg-stone-900 text-white' : 'hover:bg-stone-200'}`}
                    >
                      {toPersianDigits(p)}
                    </button>
                  )
                )}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => { setCurrentPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`page-btn w-10 h-10 rounded-full text-sm font-medium transition-colors ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-stone-200'}`}
                  aria-label="صفحه بعد"
                >
                  <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}