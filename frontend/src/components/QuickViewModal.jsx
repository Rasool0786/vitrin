import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { API, formatPrice, toPersianDigits, productImage } from '../lib/api.js';

export default function QuickViewModal() {
  const { quickViewSlug, closeQuickView, addToCart } = useApp();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(null);

  useEffect(() => {
    if (!quickViewSlug) {
      setProduct(null);
      setSelectedVariantId(null);
      return;
    }
    setLoading(true);
    setSelectedVariantId(null);
    API.product(quickViewSlug)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [quickViewSlug]);

  useEffect(() => {
    document.body.style.overflow = quickViewSlug ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [quickViewSlug]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeQuickView(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeQuickView]);

  const open = !!quickViewSlug;

  const handleConfirm = async () => {
    if (!selectedVariantId) return;
    const ok = await addToCart(selectedVariantId, 1);
    if (ok) closeQuickView();
  };

  const variants = product?.variants || [];
  const inStock = variants.filter((v) => v.stock > 0);

  const colorsMap = {};
  inStock.forEach((v) => {
    if (!colorsMap[v.color.id]) colorsMap[v.color.id] = { ...v.color, sizes: [] };
    colorsMap[v.color.id].sizes.push(v);
  });

  const hasDiscount = (product?.discount || 0) > 0;

  return (
    <div
      id="quickview-modal"
      className={
        'fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ' +
        (open ? 'opacity-100' : 'opacity-0 pointer-events-none')
      }
    >
      <div
        id="quickview-backdrop"
        onClick={closeQuickView}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <button
          id="close-quickview"
          onClick={closeQuickView}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
          aria-label="بستن"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div id="quickview-content" className="grid sm:grid-cols-2 gap-0">
          {loading && (
            <div className="col-span-2 p-8 text-center text-stone-500">
              در حال بارگذاری...
            </div>
          )}

          {!loading && !product && open && (
            <div className="col-span-2 p-8 text-center text-red-500">
              خطا در بارگذاری محصول.
            </div>
          )}

          {!loading && product && (
            <>
              <div className="aspect-[3/4] sm:aspect-auto">
                <img
                  src={productImage(product)}
                  alt={product.title}
                  className="w-full h-full object-cover rounded-t-2xl sm:rounded-r-none sm:rounded-l-2xl"
                />
              </div>

              <div className="p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto">
                <p className="text-sm text-stone-500 mb-1">
                  {product.category?.name || ''}
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3">
                  {product.title}
                </h2>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg font-semibold">
                    {formatPrice(product.final_price || product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-stone-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-600 leading-relaxed mb-6">
                  {product.description || ''}
                </p>

                {inStock.length === 0 ? (
                  <p className="text-red-500 font-medium">این محصول فعلاً موجود نیست.</p>
                ) : (
                  <>
                    <div className="mb-6">
                      <p className="text-sm font-semibold mb-3">انتخاب رنگ و سایز:</p>
                      {Object.values(colorsMap).map((color) => (
                        <div key={color.id} className="mb-4">
                          <p className="text-sm font-medium mb-2">{color.name}</p>
                          <div className="flex flex-wrap gap-2">
                            {color.sizes.map((v) => {
                              const selected = selectedVariantId === v.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => setSelectedVariantId(v.id)}
                                  className={
                                    'variant-btn px-4 py-2 border rounded-lg text-sm transition-colors ' +
                                    (selected
                                      ? 'bg-stone-900 text-white border-brand-500'
                                      : 'border-stone-300 hover:bg-brand-50 hover:border-brand-500')
                                  }
                                >
                                  {v.size.name}
                                  <span className="text-[10px] opacity-60 mr-1">
                                    ({toPersianDigits(v.stock)})
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      id="confirm-add-btn"
                      type="button"
                      disabled={!selectedVariantId}
                      onClick={handleConfirm}
                      className={
                        'w-full py-3 bg-stone-900 text-white font-medium rounded-full transition-opacity ' +
                        (!selectedVariantId ? 'opacity-50 cursor-not-allowed' : '')
                      }
                    >
                      افزودن به سبد
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}