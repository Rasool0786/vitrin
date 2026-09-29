import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { formatPrice, toPersianDigits } from '../lib/api.js';

export default function Cart() {
  const navigate = useNavigate();
  const {
    cart, refreshCart, updateCartItem, removeCartItem, showToast,
  } = useApp();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    refreshCart().finally(() => setLoading(false));
  }, [refreshCart]);

  const items = cart.items || [];
  const isEmpty = items.length === 0;
  const total = cart.total ?? 0;

  const handleCheckout = () => {
    if (isEmpty) {
      showToast('سبد خرید خالی است.', 'error');
      return;
    }
    navigate('/checkout');
  };

  const handleRefreshQty = async (variantId) => {
    await updateCartItem(variantId, 1);
    showToast('تعداد به ۱ بازنشانی شد.');
  };

  if (loading) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center">
        <p className="text-stone-500">در حال بارگذاری...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh]">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-8">
          سبد خرید
        </h1>

        {isEmpty && (
          <div id="cart-empty" className="text-center py-20">
            <svg className="w-20 h-20 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-lg font-medium text-stone-600 mb-2">سبد خرید شما خالی است</p>
            <p className="text-sm text-stone-500 mb-6">محصولات مورد علاقه‌تان را به سبد اضافه کنید</p>
            <Link
              to="/shop"
              className="inline-flex px-6 py-3 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors"
            >
              مشاهده فروشگاه
            </Link>
          </div>
        )}

        {!isEmpty && (
          <div id="cart-content" className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.variant_id}
                  item={item}
                  onRemove={() => removeCartItem(item.variant_id)}
                  onRefresh={() => handleRefreshQty(item.variant_id)}
                  onQtyMinus={() => updateCartItem(item.variant_id, item.quantity - 1)}
                  onQtyPlus={() => updateCartItem(item.variant_id, item.quantity + 1)}
                />
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-stone-200 p-6 sticky top-24">
                <h2 className="font-semibold text-lg mb-4">خلاصه سفارش</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">جمع جزء</span>
                    <span>{formatPrice(cart.subtotal ?? total)}</span>
                  </div>
                  {cart.discount_amount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>تخفیف</span>
                      <span>-{formatPrice(cart.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-500">هزینه ارسال</span>
                    <span>
                      {total >= 2000000 ? 'رایگان' : 'محاسبه در مرحله بعد'}
                    </span>
                  </div>
                  <hr className="border-stone-200" />
                  <div className="flex justify-between font-semibold text-base">
                    <span>مبلغ قابل پرداخت</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full mt-6 py-3.5 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors"
                >
                  ادامه و پرداخت
                </button>
                <Link
                  to="/shop"
                  className="block text-center mt-3 text-sm text-stone-500 hover:text-stone-800"
                >
                  ادامه خرید
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function CartItem({ item, onRemove, onRefresh, onQtyMinus, onQtyPlus }) {
  const product = item.product || {};
  const img = product.main_image || product.image;
  const detailUrl = `/product/${encodeURIComponent(product.slug || product.id)}`;
  const linePrice = (product.final_price || product.price || 0) * item.quantity;

  return (
    <div className="flex gap-4 bg-white rounded-2xl border border-stone-200 p-4">
      <Link
        to={detailUrl}
        className="w-24 h-28 sm:w-28 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-stone-100"
      >
        <img src={img} alt={product.title} className="w-full h-full object-cover" />
      </Link>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between gap-2">
          <div>
            <p className="text-xs text-stone-500">{product.category?.name || ''}</p>
            <h3 className="font-medium text-sm sm:text-base">
              <Link to={detailUrl} className="hover:text-brand-600">
                {product.title}
              </Link>
            </h3>
            {item.variant && (
              <p className="text-xs text-stone-500 mt-1">
                {item.variant.color?.name} · {item.variant.size?.name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              className="p-1.5 text-stone-400 hover:text-brand-600 transition-colors"
              aria-label="بازنشانی تعداد"
              title="بازنشانی تعداد به ۱"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
              aria-label="حذف"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-2 border border-stone-200 rounded-full">
            <button
              onClick={onQtyMinus}
              className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-900"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-medium">
              {toPersianDigits(item.quantity)}
            </span>
            <button
              onClick={onQtyPlus}
              className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-900"
            >
              +
            </button>
          </div>
          <span className="font-semibold text-sm">{formatPrice(linePrice)}</span>
        </div>
      </div>
    </div>
  );
}