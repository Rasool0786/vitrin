import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { API, formatPrice, toPersianDigits, productImage, discountPercent } from '../lib/api.js';
import ProductCard from '../components/ProductCard.jsx';

const TABS = [
  { key: 'specs',    label: 'مشخصات' },
  { key: 'shipping', label: 'ارسال و بازگشت' },
  { key: 'reviews',  label: 'نظرات مشتریان' },
];

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart, wishlistIds, toggleWishlist, showToast } = useApp();

  const [product, setProduct]   = useState(null);
  const [related, setRelated]   = useState([]);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedColorId, setSelectedColorId]     = useState(null);
  const [activeTab, setActiveTab] = useState('specs');

  const [reviewName, setReviewName]   = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText]   = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const thumbsRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setProduct(null);
    setQty(1);
    setSelectedVariantId(null);
    setSelectedColorId(null);

    API.product(slug)
      .then((p) => {
        setProduct(p);
        const firstColor = p.variants?.find((v) => v.stock > 0)?.color;
        if (firstColor) setSelectedColorId(firstColor.id);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    API.products({ category: product.category?.slug, page_size: 5 })
      .then((data) => {
        const list = (data.results || data).filter((p) => p.id !== product.id).slice(0, 4);
        setRelated(list);
      })
      .catch(() => setRelated([]));
  }, [product]);

  useEffect(() => {
    if (!product) return;
    API.productComments(product.slug)
      .then((data) => setReviews(data.results || data || []))
      .catch(() => setReviews([]));
  }, [product]);

  const isWished = product && wishlistIds.has(product.id);

  const variants = product?.variants || [];
  const inStock = variants.filter((v) => v.stock > 0);

  const colors = [];
  const seen = new Set();
  inStock.forEach((v) => {
    if (!seen.has(v.color.id)) {
      seen.add(v.color.id);
      colors.push(v.color);
    }
  });

  const sizesForColor = inStock.filter((v) => v.color.id === selectedColorId);

  const handleAddToCart = async () => {
    if (!selectedVariantId) {
      showToast('لطفاً سایز را انتخاب کنید.', 'error');
      return;
    }
    const ok = await addToCart(selectedVariantId, qty);
    if (ok) setQty(1);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      showToast('لطفاً متن نظر را بنویسید.', 'error');
      return;
    }
    setReviewSubmitting(true);
    try {
      const created = await API.createComment?.(product.slug, {
        name: reviewName.trim() || 'کاربر',
        rating: reviewRating,
        body: reviewText.trim(),
      });
      setReviews((r) => [created, ...r]);
      setReviewName('');
      setReviewRating(5);
      setReviewText('');
      showToast('نظر شما ثبت شد. ممنون!');
    } catch (err) {
      showToast(err.message || 'خطا در ثبت نظر', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center">
        <p className="text-stone-500">در حال بارگذاری...</p>
      </main>
    );
  }

  if (notFound || !product) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-lg font-medium mb-4">محصول یافت نشد.</p>
        <Link to="/shop" className="text-brand-600 hover:underline">
          بازگشت به فروشگاه
        </Link>
      </main>
    );
  }

  const discount = discountPercent(product);
  const hasDiscount = discount > 0;

  return (
    <main className="min-h-[70vh]">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <nav className="text-sm text-stone-500 mb-6" aria-label="مسیر">
          <Link to="/" className="hover:text-stone-800">صفحه اصلی</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-stone-800">فروشگاه</Link>
          <span className="mx-2">/</span>
          <span className="text-stone-800">{product.title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 xl:gap-20">
          <div className="space-y-3 lg:sticky lg:top-28 lg:self-start">
            <div className="relative aspect-[3/4] rounded-2xl lg:rounded-3xl overflow-hidden bg-stone-100 ring-1 ring-stone-200/60 shadow-lg">
              <img
                src={productImage(product)}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {product.is_new && (
                <span className="absolute top-4 right-4 bg-stone-900 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                  جدید
                </span>
              )}
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                  {toPersianDigits(discount)}٪
                </span>
              )}
            </div>
            <div ref={thumbsRef} className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <button
                  key={i}
                  type="button"
                  className={`pd-thumb aspect-square rounded-xl overflow-hidden border-2 bg-stone-100 ${i === 0 ? 'border-stone-900' : 'border-transparent'}`}
                >
                  <img
                    src={productImage(product)}
                    alt=""
                    className={`w-full h-full object-cover ${i % 2 ? 'opacity-90' : ''}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-sm font-medium text-brand-600 mb-2">
              {product.category?.name || ''}
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 leading-tight mb-3">
              {product.title}
            </h1>
            <div className="flex items-center gap-2 mb-5 text-sm">
              <span className="text-amber-500 tracking-tight">★★★★☆</span>
              <span className="text-stone-500">
                {toPersianDigits((product.rating || 4.6).toFixed(1))} · {toPersianDigits(product.comments_count || reviews.length)} نظر
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className="text-2xl font-bold text-stone-900">
                {formatPrice(product.final_price || product.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-stone-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                    {toPersianDigits(discount)}٪ تخفیف
                  </span>
                </>
              )}
            </div>

            <p className="text-stone-600 leading-relaxed mb-8 text-[15px]">
              {product.description}
            </p>

            {colors.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-2.5">رنگ</p>
                <div className="flex gap-2">
                  {colors.map((c) => {
                    const selected = selectedColorId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedColorId(c.id);
                          setSelectedVariantId(null);
                        }}
                        className={
                          'color-btn w-9 h-9 rounded-full ring-2 ring-offset-2 transition-all ' +
                          (selected ? 'ring-stone-900' : 'ring-transparent hover:ring-stone-400')
                        }
                        style={{ background: c.hex || c.code || '#a88b5e' }}
                        aria-label={c.name}
                        title={c.name}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {sizesForColor.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-sm font-medium">سایز</p>
                  <Link to="/guide" className="text-xs text-brand-600 hover:underline">
                    راهنمای سایز
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizesForColor.map((v) => {
                    const selected = selectedVariantId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={
                          'size-btn w-12 h-12 rounded-xl text-sm font-medium transition-colors ' +
                          (selected
                            ? 'border-2 border-stone-900'
                            : 'border border-stone-200 hover:border-stone-900')
                        }
                      >
                        {v.size.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-8">
              <p className="text-sm font-medium mb-2.5">تعداد</p>
              <div className="inline-flex items-center border border-stone-200 rounded-full">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center text-stone-500 hover:text-stone-900 text-lg"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold">{toPersianDigits(qty)}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="w-11 h-11 flex items-center justify-center text-stone-500 hover:text-stone-900 text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={inStock.length === 0}
                className={
                  'flex-1 py-4 bg-stone-900 text-white font-medium rounded-full transition-all shadow-lg shadow-stone-900/10 ' +
                  (inStock.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-stone-800')
                }
              >
                {inStock.length === 0 ? 'ناموجود' : 'افزودن به سبد'}
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className="sm:w-14 py-4 border border-stone-200 rounded-full hover:bg-stone-100 transition-colors flex items-center justify-center"
                aria-label="علاقه‌مندی"
              >
                <svg
                  className={`w-5 h-5 ${isWished ? 'text-rose-600' : ''}`}
                  fill={isWished ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <TrustItem icon="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" text="ارسال رایگان بالای ۲ میلیون" />
              <TrustItem icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" text="ضمانت بازگشت ۷ روزه" />
              <TrustItem icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" text="پرداخت امن" />
            </div>
          </div>
        </div>

        <section className="mt-14 lg:mt-20">
          <div className="flex flex-wrap gap-2 border-b border-stone-200 mb-6">
            {TABS.map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={
                    'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ' +
                    (active
                      ? 'border-stone-900 text-stone-900'
                      : 'border-transparent text-stone-500')
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'specs' && (
            <div className="text-sm text-stone-600 leading-relaxed space-y-3">
              <ul className="space-y-2 list-disc list-inside">
                <li>پارچه باکیفیت و دوخت دقیق</li>
                <li>مناسب استفاده روزمره و استایل شهری</li>
                <li>راهنمای شستشو: شستشو با آب سرد، خشک کردن در سایه</li>
                <li>ساخت ایران — برند ویترین</li>
              </ul>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="text-sm text-stone-600 leading-relaxed space-y-3">
              <p>ارسال عادی: تهران ۱–۲ روز، شهرستان ۲–۴ روز کاری. سفارش‌های بالای ۲ میلیون تومان <strong>ارسال رایگان</strong>.</p>
              <p>
                امکان بازگشت تا ۷ روز پس از دریافت، در صورت سالم بودن کالا و برچسب. جزئیات در صفحه{' '}
                <Link to="/returns" className="text-brand-600 hover:underline">شرایط بازگشت</Link>.
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-3xl font-bold">{(product.rating || 4.6).toFixed(1)}</div>
                <div>
                  <div className="flex text-amber-500 text-sm mb-0.5">★★★★☆</div>
                  <p className="text-xs text-stone-500">بر اساس {toPersianDigits(reviews.length)} نظر</p>
                </div>
              </div>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-stone-500 py-4">هنوز نظری ثبت نشده است.</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="bg-white border border-stone-200 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{r.name || r.user_name || 'کاربر'}</span>
                        <span className="text-amber-500 text-xs">
                          {'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600">{r.body || r.text}</p>
                      <p className="text-xs text-stone-400 mt-2">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('fa-IR') : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSubmitReview} className="mt-8 bg-stone-100 rounded-2xl p-5 space-y-4" noValidate>
                <h3 className="font-semibold text-sm">ثبت نظر شما</h3>
                <div>
                  <label className="block text-xs font-medium mb-1">نام</label>
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                    placeholder="نام شما"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">امتیاز</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-stone-200 rounded-xl outline-none"
                  >
                    <option value={5}>۵ ستاره</option>
                    <option value={4}>۴ ستاره</option>
                    <option value={3}>۳ ستاره</option>
                    <option value={2}>۲ ستاره</option>
                    <option value={1}>۱ ستاره</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">نظر</label>
                  <textarea
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-stone-200 rounded-xl outline-none focus:border-brand-500 resize-none"
                    placeholder="نظر خود را بنویسید..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-6 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-full disabled:opacity-50"
                >
                  {reviewSubmitting ? 'در حال ارسال...' : 'ارسال نظر'}
                </button>
              </form>
            </div>
          )}
        </section>

        {related.length > 0 && (
          <section className="mt-16 lg:mt-24">
            <h2 className="text-xl font-bold mb-6">محصولات مشابه</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function TrustItem({ icon, text }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-stone-600 bg-stone-100 rounded-xl px-3 py-3">
      <svg className="w-5 h-5 text-brand-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
      </svg>
      <span>{text}</span>
    </div>
  );
}