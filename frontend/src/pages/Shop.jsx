import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API, toPersianDigits } from '../lib/api.js';
import ProductCard from '../components/ProductCard.jsx';

const PER_PAGE = 12;

const PRICE_RANGES = [
  { value: 'all', label: 'همه قیمت‌ها' },
  { value: '0-1000000', label: 'زیر ۱ میلیون' },
  { value: '1000000-2000000', label: '۱ تا ۲ میلیون' },
  { value: '2000000-3000000', label: '۲ تا ۳ میلیون' },
  { value: '3000000-99999999', label: 'بالای ۳ میلیون' },
];

const SORT_OPTIONS = [
  { value: 'all', label: 'پیش‌فرض' },
  { value: 'newest', label: 'جدیدترین' },
  { value: 'cheapest', label: 'ارزان‌ترین' },
  { value: 'expensive', label: 'گران‌ترین' },
  { value: 'discount', label: 'بیشترین تخفیف' },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Stateها
  const [categories, setCategories] = useState([]);
  const [currentCat, setCurrentCat] = useState(searchParams.get('cat') || 'all');
  const [currentSort, setCurrentSort] = useState(searchParams.get('sort') || 'all');
  const [currentPrice, setCurrentPrice] = useState(searchParams.get('price') || 'all');
  const [onlySale, setOnlySale] = useState(searchParams.get('filter') === 'sale');
  const [onlyNew, setOnlyNew] = useState(searchParams.get('filter') === 'newest');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(Math.max(1, Number(searchParams.get('page')) || 1));

  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const searchDebounce = useRef(null);

  // گرفتن دسته‌بندی‌ها از API
  useEffect(() => {
    API.categories()
      .then((data) => {
        const list = data.results || data || [];
        setCategories(list);
      })
      .catch(() => setCategories([]));
  }, []);

  // همگام‌سازی با URL
  useEffect(() => {
    setCurrentCat(searchParams.get('cat') || 'all');
    setSearchQuery(searchParams.get('search') || '');
    setOnlySale(searchParams.get('filter') === 'sale');
    setOnlyNew(searchParams.get('filter') === 'newest');
    setCurrentSort(searchParams.get('sort') || 'all');
    setCurrentPrice(searchParams.get('price') || 'all');
    setCurrentPage(Math.max(1, Number(searchParams.get('page')) || 1));
  }, [searchParams]);

  // ساخت پارامترهای API
  const buildParams = useCallback(() => {
    const params = {
      page: currentPage,
      page_size: PER_PAGE,
    };

    if (currentCat !== 'all') params.category = currentCat;
    if (searchQuery.trim()) params.search = searchQuery.trim();

    if (currentPrice !== 'all') {
      const [min, max] = currentPrice.split('-');
      params.min_price = min;
      params.max_price = max;
    }

    if (onlySale) params.has_discount = true;
    if (onlyNew) params.is_new = true;

    switch (currentSort) {
      case 'newest':
        params.ordering = '-datetime_created';
        break;
      case 'cheapest':
        params.ordering = 'price';
        break;
      case 'expensive':
        params.ordering = '-price';
        break;
      case 'discount':
        params.ordering = '-discount';
        break;
      default:
        break;
    }

    return params;
  }, [currentCat, currentSort, currentPrice, onlySale, onlyNew, searchQuery, currentPage]);

  // گرفتن محصولات
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    API.products(buildParams())
      .then((data) => {
        if (cancelled) return;
        setProducts(data.results || data || []);
        setTotalCount(data.count ?? (data.results || data).length);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setTotalCount(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buildParams]);

  // به‌روزرسانی URL وقتی فیلتر تغییر می‌کند
  const updateURL = (updates) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === 'all' || value === false || value === '' || value === 1) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // صفحه را وقتی فیلتر عوض می‌شود ریست کن
    if (!('page' in updates)) {
      params.delete('page');
    }

    setSearchParams(params);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      updateURL({ search: value.trim(), page: 1 });
    }, 500);
  };

  const resetAllFilters = () => {
    setSearchParams({});
  };

  const totalPages = Math.ceil(totalCount / PER_PAGE) || 1;

  const getPageTitle = () => {
    if (searchQuery) return { title: `نتایج جستجو: ${searchQuery}`, subtitle: `${toPersianDigits(totalCount)} محصول یافت شد` };
    if (currentCat !== 'all') {
      const cat = categories.find((c) => c.slug === currentCat);
      return { title: cat?.name || currentCat, subtitle: `محصولات ${cat?.name || currentCat}` };
    }
    if (onlySale) return { title: 'تخفیف‌ها', subtitle: 'محصولات با تخفیف ویژه' };
    if (onlyNew) return { title: 'جدیدترین‌ها', subtitle: 'تازه‌های ویترین' };
    return { title: 'فروشگاه', subtitle: 'همه محصولات ویترین' };
  };

  const { title, subtitle } = getPageTitle();

  const FiltersContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">فیلترها</h2>
        <button onClick={resetAllFilters} className="text-xs text-brand-600 hover:underline">
          پاک کردن همه
        </button>
      </div>

      {/* سرچ داخل فیلتر */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-stone-700">جستجو</h3>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="نام محصول..."
          className="w-full px-3 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
        />
      </div>

      <hr className="border-stone-200" />

      {/* دسته‌بندی از API */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-stone-700">دسته‌بندی</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          <button
            onClick={() => updateURL({ cat: 'all', page: 1 })}
            className={`w-full text-right px-3 py-2 text-sm rounded-lg transition-colors hover:bg-stone-100 ${
              currentCat === 'all' ? 'bg-stone-900 text-white' : ''
            }`}
          >
            همه
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => updateURL({ cat: c.slug, page: 1 })}
              className={`w-full text-right px-3 py-2 text-sm rounded-lg transition-colors hover:bg-stone-100 ${
                currentCat === c.slug ? 'bg-stone-900 text-white' : ''
              }`}
            >
              {c.name}
              {c.product_count != null && (
                <span className="text-xs opacity-70 mr-1">({toPersianDigits(c.product_count)})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-stone-200" />

      {/* محدوده قیمت */}
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
                onChange={() => updateURL({ price: r.value, page: 1 })}
                className="accent-brand-600"
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-stone-200" />

      {/* ویژگی‌ها */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-stone-700">ویژگی‌ها</h3>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={onlySale}
              onChange={(e) => updateURL({ filter: e.target.checked ? 'sale' : '', page: 1 })}
              className="accent-brand-600 rounded"
            />
            <span>فقط تخفیف‌دار</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={onlyNew}
              onChange={(e) => updateURL({ filter: e.target.checked ? 'newest' : '', page: 1 })}
              className="accent-brand-600 rounded"
            />
            <span>فقط جدید</span>
          </label>
        </div>
      </div>

      <hr className="border-stone-200" />

      {/* مرتب‌سازی */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-stone-700">مرتب‌سازی</h3>
        <select
          value={currentSort}
          onChange={(e) => updateURL({ sort: e.target.value, page: 1 })}
          className="w-full px-3 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
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
        {/* دکمه فیلتر موبایل */}
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
          {/* سایدبار دسکتاپ */}
          <aside className="lg:w-72 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24 bg-white rounded-2xl border border-stone-200 p-5">
              <FiltersContent />
            </div>
          </aside>

          {/* فیلتر موبایل */}
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

          {/* لیست محصولات */}
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

            {!loading && products.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-medium text-stone-600">محصولی پیدا نشد.</p>
                <button onClick={resetAllFilters} className="mt-4 text-brand-600 font-medium hover:underline">
                  پاک کردن فیلترها
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {loading
                  ? Array(PER_PAGE)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="aspect-[3/4] rounded-xl bg-stone-200" />
                          <div className="pt-3 space-y-2">
                            <div className="h-3 w-16 bg-stone-200 rounded" />
                            <div className="h-4 w-3/4 bg-stone-200 rounded" />
                            <div className="h-4 w-24 bg-stone-200 rounded" />
                          </div>
                        </div>
                      ))
                  : products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {/* صفحه‌بندی */}
            {totalPages > 1 && !loading && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => updateURL({ page })}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 hover:bg-stone-200'
                    }`}
                  >
                    {toPersianDigits(page)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
