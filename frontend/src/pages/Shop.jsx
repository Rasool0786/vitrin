import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  { value: '', label: 'پیش‌فرض' },
  { value: '-datetime_created', label: 'جدیدترین' },
  { value: 'price', label: 'ارزان‌ترین' },
  { value: '-price', label: 'گران‌ترین' },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // خواندن از URL
  const currentCat = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';
  const currentPrice = searchParams.get('price') || 'all';
  const currentSort = searchParams.get('ordering') || '';
  const inStock = searchParams.get('in_stock') === 'true';
  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1);

  // گرفتن دسته‌بندی‌ها
  useEffect(() => {
    API.categories()
      .then((data) => setCategories(data.results || data || []))
      .catch(() => setCategories([]));
  }, []);

  // ساخت پارامترهای API (دقیقاً مطابق ProductFilter)
  const buildParams = useCallback(() => {
    const params = {
      page: currentPage,
      page_size: PER_PAGE,
    };

    if (currentCat) params.category = currentCat;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (inStock) params.in_stock = true;
    if (currentSort) params.ordering = currentSort;

    if (currentPrice !== 'all') {
      const [min, max] = currentPrice.split('-');
      params.min_price = min;
      params.max_price = max;
    }

    return params;
  }, [currentCat, searchQuery, currentPrice, currentSort, inStock, currentPage]);

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

    return () => { cancelled = true; };
  }, [buildParams]);

  // به‌روزرسانی URL
  const updateURL = (updates) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all' || value === false) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    if (!('page' in updates)) {
      params.delete('page');
    }

    setSearchParams(params);
  };

  const resetAllFilters = () => setSearchParams({});

  const totalPages = Math.ceil(totalCount / PER_PAGE) || 1;

  const getPageTitle = () => {
    if (searchQuery) return { title: `جستجو: ${searchQuery}`, subtitle: `${toPersianDigits(totalCount)} محصول` };
    if (currentCat) {
      const cat = categories.find((c) => c.slug === currentCat);
      return { title: cat?.name || currentCat, subtitle: `محصولات ${cat?.name || ''}` };
    }
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

      {/* سرچ */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-stone-700">جستجو در عنوان</h3>
        <input
          type="search"
          defaultValue={searchQuery}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateURL({ search: e.target.value.trim(), page: 1 });
            }
          }}
          placeholder="مثلاً شلوار..."
          className="w-full px-3 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
        />
        <p className="text-xs text-stone-400 mt-1">Enter بزنید</p>
      </div>

      <hr className="border-stone-200" />

      {/* دسته‌بندی */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-stone-700">دسته‌بندی</h3>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          <button
            onClick={() => updateURL({ category: '', page: 1 })}
            className={`w-full text-right px-3 py-2 text-sm rounded-lg transition-colors hover:bg-stone-100 ${
              !currentCat ? 'bg-stone-900 text-white' : ''
            }`}
          >
            همه
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => updateURL({ category: c.slug, page: 1 })}
              className={`w-full text-right px-3 py-2 text-sm rounded-lg transition-colors hover:bg-stone-100 ${
                currentCat === c.slug ? 'bg-stone-900 text-white' : ''
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-stone-200" />

      {/* قیمت */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-stone-700">محدوده قیمت</h3>
        <div className="space-y-2">
          {PRICE_RANGES.map((r) => (
            <label key={r.value} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="price"
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

      {/* موجودی */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateURL({ in_stock: e.target.checked ? 'true' : '', page: 1 })}
            className="accent-brand-600 rounded"
          />
          <span>فقط کالاهای موجود</span>
        </label>
      </div>

      <hr className="border-stone-200" />

      {/* مرتب‌سازی */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-stone-700">مرتب‌سازی</h3>
        <select
          value={currentSort}
          onChange={(e) => updateURL({ ordering: e.target.value, page: 1 })}
          className="w-full px-3 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
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
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-stone-200 rounded-xl text-sm font-medium"
          >
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
                  <button onClick={() => setMobileFiltersOpen(false)} className="p-2">✕</button>
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
            <p className="text-sm text-stone-500 mb-6">
              {toPersianDigits(totalCount)} محصول
            </p>

            {!loading && products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg font-medium text-stone-600">محصولی پیدا نشد.</p>
                <button onClick={resetAllFilters} className="mt-4 text-brand-600 font-medium hover:underline">
                  پاک کردن فیلترها
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {loading
                  ? Array(12).fill(0).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="aspect-[3/4] rounded-xl bg-stone-200" />
                        <div className="pt-3 space-y-2">
                          <div className="h-3 w-16 bg-stone-200 rounded" />
                          <div className="h-4 w-3/4 bg-stone-200 rounded" />
                        </div>
                      </div>
                    ))
                  : products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {totalPages > 1 && !loading && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => updateURL({ page })}
                    className={`w-10 h-10 rounded-full text-sm font-medium ${
                      currentPage === page ? 'bg-stone-900 text-white' : 'bg-stone-100'
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
