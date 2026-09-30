import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { API, toPersianDigits } from '../lib/api.js';
import ProductCard from '../components/ProductCard.jsx';

const FILTERS = [
  { key: 'all',        label: 'همه' },
  { key: 'newest',     label: 'جدیدترین' },
  { key: 'bestseller', label: 'پرفروش‌ترین' },
  { key: 'cheapest',   label: 'ارزان‌ترین' },
  { key: 'expensive',  label: 'گران‌ترین' },
];

function getOrderingForFilter(filter) {
  switch (filter) {
    case 'cheapest':   return 'price';
    case 'expensive':  return '-price';
    case 'bestseller': return '-comments_count';
    case 'newest':     return '-datetime_created';
    default:           return undefined;
  }
}

export default function Home() {
  const { showToast } = useApp();

  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [arrivals, setArrivals]     = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [productsLoading, setProductsLoading] = useState(true);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  useEffect(() => {
    API.categories()
      .then((data) => setCategories((data.results || data || []).slice(0, 6)))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setProductsLoading(true);
    API.products({ ordering: getOrderingForFilter(currentFilter) })
      .then((data) => setProducts(data.results || data))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [currentFilter]);

  useEffect(() => {
    API.products({ ordering: '-datetime_created' })
      .then((data) => setArrivals((data.results || data).slice(0, 4)))
      .catch(() => setArrivals([]));
  }, []);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    setNewsletterError('');
    setNewsletterSuccess(false);

    const email = newsletterEmail.trim();
    if (!email) {
      setNewsletterError('لطفاً ایمیل خود را وارد کنید.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewsletterError('ایمیل وارد شده معتبر نیست.');
      return;
    }

    try {
      await API.subscribeNewsletter(email);
      setNewsletterEmail('');
      setNewsletterSuccess(true);
      showToast('عضویت شما با موفقیت ثبت شد.');
      setTimeout(() => setNewsletterSuccess(false), 5000);
    } catch (err) {
      setNewsletterError(err.message || 'خطا در ثبت ایمیل.');
    }
  };

  const productSkeleton = (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-xl bg-stone-200" />
      <div className="pt-3 pb-1.5 px-1 space-y-2">
        <div className="h-3 w-16 bg-stone-200 rounded" />
        <div className="h-4 w-3/4 bg-stone-200 rounded" />
        <div className="h-4 w-24 bg-stone-200 rounded" />
      </div>
    </div>
  );

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-100 to-stone-50">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[75vh] lg:min-h-[85vh] py-14 lg:py-20">

            <div className="order-2 lg:order-1 text-center lg:text-right space-y-7 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                کالکشن جدید ۱۴۰۵
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.15] text-stone-900 tracking-tight">
                استایل تازه،<br />
                <span className="bg-gradient-to-l from-brand-600 to-brand-400 bg-clip-text text-transparent">
                  انتخاب تازه
                </span>
              </h1>
              <p className="text-base sm:text-lg text-stone-600 max-w-md mx-auto lg:mx-0 leading-relaxed">
                جدیدترین لباس‌ها را با طراحی مدرن و کیفیتی که شایسته شماست تجربه کنید.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/15 hover:shadow-2xl hover:-translate-y-0.5"
                >
                  مشاهده کالکشن
                  <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  to="/shop?filter=newest"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-stone-900/20 text-stone-900 font-medium rounded-full hover:border-stone-900 hover:bg-stone-900/5 transition-all"
                >
                  خرید جدیدترین‌ها
                </Link>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs text-stone-500">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  ارسال رایگان
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  ضمانت ۷ روزه
                </span>
              </div>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-brand-200/40 to-transparent rounded-[2rem] blur-2xl pointer-events-none" />
              <div className="relative aspect-[4/5] lg:aspect-[3/4] rounded-2xl lg:rounded-[1.75rem] overflow-hidden shadow-2xl ring-1 ring-stone-900/5">
                <img
                  src="#"
                  alt="مدل لباس ویترین - کالکشن جدید"
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                  loading="eager"
                />
              </div>
              <div className="absolute -bottom-3 -left-3 lg:-bottom-5 lg:-left-5 bg-white/95 backdrop-blur rounded-2xl shadow-xl p-4 lg:p-5 hidden sm:block border border-stone-100">
                <p className="text-xs text-stone-500">ارسال رایگان</p>
                <p className="font-semibold text-sm">بالای ۲ میلیون تومان</p>
              </div>
              <div className="absolute -top-2 -right-2 lg:top-6 lg:-right-4 bg-stone-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg hidden sm:block">
                تا ۳۰٪ تخفیف
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="py-16 lg:py-24">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 lg:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">دسته‌بندی‌ها</h2>
            <p className="mt-2 text-stone-500">آنچه برای استایل شما نیاز دارید</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {categories.length === 0
              ? Array(6).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse aspect-[3/4] rounded-2xl bg-stone-200" />
                ))
              : categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/shop?cat=${encodeURIComponent(cat.slug)}`}
                    className="category-card group relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-200"
                  >
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-4 text-white">
                      <h3 className="font-semibold text-sm sm:text-base">{cat.name}</h3>
                      <p className="text-xs opacity-80 mt-0.5">
                        {toPersianDigits(cat.product_count || 0)} محصول
                      </p>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section id="products" className="py-16 lg:py-24 bg-white">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">پرفروش‌ترین‌ها</h2>
              <p className="mt-1 text-stone-500">محبوب‌ترین انتخاب‌های مشتریان</p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="فیلتر محصولات">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setCurrentFilter(f.key)}
                  className={`filter-btn ${currentFilter === f.key ? 'active' : ''} px-4 py-2 text-sm font-medium rounded-full border transition-all`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {!productsLoading && products.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-medium text-stone-600">محصولی یافت نشد.</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {productsLoading
              ? Array(8).fill(0).map((_, i) => <div key={i}>{productSkeleton}</div>)
              : products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* PROMO */}
      <section id="promo" className="py-12 lg:py-16">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-l from-brand-800 via-brand-700 to-brand-600 text-white">
            <div className="absolute inset-0 opacity-20">
              <img
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80"
                alt="کالکشن پاییزه ویترین"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="relative px-8 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-20 text-center sm:text-right">
              <p className="text-sm font-medium tracking-widest opacity-90 mb-2">پیشنهاد ویژه</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                تا ۳۰٪ تخفیف روی کالکشن پاییزه
              </h2>
              <p className="text-base sm:text-lg opacity-90 max-w-lg mb-8 mx-auto sm:mx-0">
                استایل مورد علاقه‌تان را با قیمت بهتر پیدا کنید.
              </p>
              <Link
                to="/shop?filter=sale"
                className="inline-flex items-center px-8 py-3.5 bg-white text-brand-800 font-semibold rounded-full hover:bg-stone-100 transition-colors shadow-lg"
              >
                مشاهده تخفیف‌ها
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section id="new-arrivals" className="py-16 lg:py-24">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 lg:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">تازه‌های ویترین</h2>
              <p className="mt-1 text-stone-500">جدیدترین اضافه‌شده‌ها به فروشگاه</p>
            </div>
            <Link to="/shop?filter=newest" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
              مشاهده همه
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {arrivals.length === 0
              ? Array(4).fill(0).map((_, i) => <div key={i}>{productSkeleton}</div>)
              : arrivals.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link to="/shop?filter=newest" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600">
              مشاهده همه
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* BRAND STORY */}
      <section className="py-16 lg:py-24 bg-stone-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=700&q=80"
                  alt="درباره ویترین"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="space-y-6 text-center lg:text-right">
              <p className="text-sm font-medium tracking-widest text-brand-600">داستان ما</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
                ویترین؛ ساده، شیک، ماندگار
              </h2>
              <p className="text-stone-600 leading-relaxed text-base sm:text-lg">
                ما در ویترین باور داریم که لباس خوب باید هم زیبا باشد، هم راحت و هم ماندگار. هر قطعه با دقت در طراحی مدرن، انتخاب پارچه باکیفیت و دوخت دقیق ساخته می‌شود تا استایل شما را در هر لحظه تکمیل کند.
              </p>
              <p className="text-stone-600 leading-relaxed">
                تمرکز ما روی سادگی هوشمندانه، کیفیت واقعی و طراحی بی‌زمان است — لباس‌هایی که سال‌ها با شما می‌مانند.
              </p>
              <Link to="/about" className="inline-flex items-center gap-2 text-brand-600 font-medium hover:underline mt-2">
                بیشتر بدانید
                <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-16 lg:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
            از جدیدترین‌ها باخبر باشید
          </h2>
          <p className="text-stone-500 mb-8 leading-relaxed">
            برای اطلاع از کالکشن‌های جدید، تخفیف‌ها و پیشنهادهای ویژه ایمیل خود را ثبت کنید.
          </p>
          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" noValidate>
            <div className="flex-1 relative">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="ایمیل شما"
                className="w-full px-5 py-3.5 text-sm bg-stone-100 border border-stone-200 rounded-full outline-none focus:border-brand-500 transition-colors"
                aria-label="ایمیل"
                required
              />
              {newsletterError && (
                <p className="absolute -bottom-6 right-4 text-xs text-red-500">{newsletterError}</p>
              )}
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors whitespace-nowrap"
            >
              عضویت
            </button>
          </form>
          {newsletterSuccess && (
            <p className="mt-6 text-sm text-green-600">
              با موفقیت ثبت شد. ممنون از همراهی شما!
            </p>
          )}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-12 lg:py-16 border-t border-stone-200">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <Benefit title="ارسال سریع" desc="ارسال سفارش‌ها در کوتاه‌ترین زمان">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </Benefit>
            <Benefit title="تضمین کیفیت" desc="انتخاب شده با وسواس برای شما">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </Benefit>
            <Benefit title="پرداخت امن" desc="پرداخت مطمئن و امن">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </Benefit>
            <Benefit title="ضمانت بازگشت" desc="امکان بازگشت کالا طبق قوانین فروشگاه">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </Benefit>
          </div>
        </div>
      </section>
    </main>
  );
}

function Benefit({ title, desc, children }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 p-4">
      <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {children}
        </svg>
      </div>
      <h3 className="font-semibold text-sm sm:text-base">{title}</h3>
      <p className="text-xs sm:text-sm text-stone-500">{desc}</p>
    </div>
  );
}