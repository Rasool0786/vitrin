import { useState, useEffect } from 'react';
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

  const [activeImage, setActiveImage] = useState('');

  const [reviewName, setReviewName]   = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText]   = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setProduct(null);
    setQty(1);
    setSelectedVariantId(null);
    setSelectedColorId(null);
    setActiveImage('');

    API.product(slug)
      .then((p) => {
        setProduct(p);
        setActiveImage(productImage(p));
        const firstAvailable = p.variants?.find((v) => v.stock > 0);
        if (firstAvailable) {
          setSelectedColorId(firstAvailable.color.id);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    API.products({ category: product.category?.slug, page_size: 5 })
      .then((data) => {
        const list = (data.results || data)
          .filter((p) => p.id !== product.id)
          .slice(0, 4);
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
  const seenColors = new Set();
  inStock.forEach((v) => {
    if (!seenColors.has(v.color.id)) {
      seenColors.add(v.color.id);
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
      const response = await API.createComment(product.slug, {
        name: reviewName.trim() || 'کاربر',
        stars: reviewRating,
        text: reviewText.trim(),
      });
      
      const newComment = response.comment || response;
      setReviews((prev) => [newComment, ...prev]);
      
      setReviewName('');
      setReviewRating(5);
      setReviewText('');
      showToast('نظر شما ثبت شد و پس از تایید نمایش داده می‌شود.');
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

  const totalComments = product.comments_count || reviews.length;
  const avgRating = totalComments > 0 ? (product.average_rating || 0) : 0;

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
          {/* تصاویر */}
          <div className="space-y-3 lg:sticky lg:top-28 lg:self-start">
            <div className="relative aspect-[3/4] rounded-2xl lg:rounded-3xl overflow-hidden bg-stone-100 ring-1 ring-stone-200/60 shadow-lg">
              <img
                src={activeImage || productImage(product)}
                alt={product.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                  {toPersianDigits(discount)}٪
                </span>
              )}
            </div>

            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((img, i) => {
                  const isSelected = activeImage === img.image;
                  return (
                    <button
                      key={img.id || i}
                      type="button"
                      onClick={() => setActiveImage(img.image)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 bg-stone-100 transition-all ${
                        isSelected ? 'border-stone-900 ring-2 ring-stone-900/20' : 'border-transparent hover:border-stone-400'
                      }`}
                    >
                      <img
                        src={img.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* اطلاعات محصول */}
          <div className="flex flex-col">
            <p className="text-sm font-medium text-brand-600 mb-2">
              {product.category?.name || ''}
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 leading-tight mb-3">
              {product.title}
            </h1>

            <div className="flex items-center gap-2 mb-5 text-sm">
              <span className="text-amber-500 tracking-tight">
                {totalComments > 0 ? (
                  <>
                    {'★'.repeat(Math.round(avgRating))}
                    {'☆'.repeat(5 - Math.round(avgRating))}
                  </>
                ) : (
                  '☆☆☆☆☆'
                )}
              </span>
              <span className="text-stone-500">
                {totalComments > 0 
                  ? `${toPersianDigits(avgRating.toFixed(1))} · ${toPersianDigits(totalComments)} نظر`
                  : 'هنوز نظری ثبت نشده'}
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

            {/* رنگ */}
            {colors.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-2.5">رنگ</p>
                <div className="flex gap-2 flex-wrap">
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
                          'w-9 h-9 rounded-full ring-2 ring-offset-2 transition-all ' +
                          (selected ? 'ring-stone-900' : 'ring-transparent hover:ring-stone-400')
                        }
                        style={{ background: c.code || c.hex || '#a88b5e' }}
                        aria-label={c.name}
                        title={c.name}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* سایز */}
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
                          'w-12 h-12 rounded-xl text-sm font-medium transition-colors ' +
                          (selected
                            ? 'border-2 border-stone-900 bg-stone-900 text-white'
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

            {/* تعداد */}
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
                <span className="w-10 text-center text-sm font-semibold">
                  {toPersianDigits(qty)}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="w-11 h-11 flex items-center justify-center text-stone-500 hover:text-stone-900 text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* دکمه‌ها */}
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
          </div>
        </div>

        {/* تب‌ها */}
        <div className="mt-16">
          <div className="flex gap-6 border-b border-stone-200 mb-8">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-b-2 border-stone-900 text-stone-900'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'specs' && (
            <div className="prose prose-stone max-w-none text-stone-600">
              <p>{product.description}</p>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="text-stone-600 space-y-3 text-sm leading-relaxed">
              <p>• ارسال رایگان برای سفارش‌های بالای ۲ میلیون تومان</p>
              <p>• امکان بازگشت کالا تا ۷ روز پس از دریافت</p>
              <p>• زمان تحویل تقریبی ۲ تا ۵ روز کاری</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-10">
              {/* فرم ثبت نظر (آورده شده به بالای لیست نظرات برای دسترسی بهتر UX) */}
              <form onSubmit={handleSubmitReview} className="bg-stone-50 rounded-2xl p-6 space-y-4 border border-stone-200/60">
                <h3 className="font-semibold text-lg">نظر خود را بنویسید</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">نام</label>
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                    placeholder="نام شما"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">امتیاز</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl ${star <= reviewRating ? 'text-amber-400' : 'text-stone-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">متن نظر</label>
                  <textarea
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-stone-200 rounded-xl outline-none focus:border-brand-500 resize-none"
                    placeholder="نظر خود را بنویسید..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-6 py-3 bg-stone-900 text-white font-medium rounded-full text-sm disabled:opacity-50"
                >
                  {reviewSubmitting ? 'در حال ارسال...' : 'ثبت نظر'}
                </button>
              </form>

              {/* لیست نظرات */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-stone-500 text-center py-8">هنوز نظری ثبت نشده است. اولین نفری باشید که نظر می‌دهد!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-white border border-stone-200 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{review.name}</span>
                        <span className="text-amber-400 text-sm">
                          {'★'.repeat(review.stars || 5)}
                        </span>
                      </div>
                      <p className="text-stone-600 text-sm leading-relaxed">{review.text}</p>
                      <p className="text-xs text-stone-400 mt-2">
                        {new Date(review.datetime_created).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-xl font-bold mb-6">محصولات مرتبط</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
