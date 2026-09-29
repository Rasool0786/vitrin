import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { API, formatPrice, toPersianDigits } from '../lib/api.js';

export default function Checkout() {
  const { cart, refreshCart, showToast } = useApp();

  const [submitting, setSubmitting] = useState(false);
  const [orderCode, setOrderCode] = useState(null);

  const [form, setForm] = useState({
    fullname: '',
    phone: '',
    city: '',
    address: '',
    postal: '',
    shipping: 'normal',
    payment: 'online',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const items = cart.items || [];
  const isEmpty = items.length === 0;
  const total = cart.total ?? 0;
  const shippingLabel = total >= 2000000 ? 'رایگان' : 'محاسبه بعد از ثبت';

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const required = ['fullname', 'phone', 'city', 'address'];
    const next = {};
    required.forEach((f) => {
      if (!form[f].trim()) next[f] = true;
    });
    if (Object.keys(next).length) {
      setErrors(next);
      showToast('لطفاً فیلدهای الزامی را پر کنید.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const order = await API.createOrder({
        fullname: form.fullname.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        postal: form.postal.trim(),
        shipping: form.shipping,
        payment: form.payment,
      });
      setOrderCode(order.code || order.order_code || 'SHK-XXXXXX');
      await refreshCart();
    } catch (err) {
      showToast(err.message || 'خطا در ثبت سفارش.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderCode) {
    return (
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div id="order-success" className="text-center py-16 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">سفارش ثبت شد</h2>
          <p className="text-stone-500 mb-2">
            کد پیگیری: <strong>{orderCode}</strong>
          </p>
          <p className="text-sm text-stone-500 mb-8">در نسخه دمو پرداخت واقعی انجام نمی‌شود.</p>
          <Link
            to="/dashboard"
            className="inline-flex px-6 py-3 bg-stone-900 text-white font-medium rounded-full"
          >
            مشاهده حساب کاربری
          </Link>
        </div>
      </main>
    );
  }

  if (isEmpty) {
    return (
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8">تسویه حساب</h1>
        <div id="checkout-empty" className="text-center py-16">
          <p className="text-lg font-medium mb-4">سبد خرید خالی است.</p>
          <Link to="/shop" className="text-brand-600 hover:underline">
            رفتن به فروشگاه
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">تسویه حساب</h1>

      <div id="checkout-form-wrap" className="grid lg:grid-cols-5 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6" noValidate>
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <h2 className="font-semibold text-lg">اطلاعات گیرنده</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={form.fullname}
                  onChange={(e) => update('fullname', e.target.value)}
                  className={`w-full px-4 py-3 text-sm bg-stone-50 border rounded-xl outline-none focus:border-brand-500 ${errors.fullname ? 'border-red-500' : 'border-stone-200'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">شماره موبایل</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className={`w-full px-4 py-3 text-sm bg-stone-50 border rounded-xl outline-none focus:border-brand-500 ${errors.phone ? 'border-red-500' : 'border-stone-200'}`}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">استان / شهر</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                className={`w-full px-4 py-3 text-sm bg-stone-50 border rounded-xl outline-none focus:border-brand-500 ${errors.city ? 'border-red-500' : 'border-stone-200'}`}
                placeholder="تهران"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">آدرس کامل</label>
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                className={`w-full px-4 py-3 text-sm bg-stone-50 border rounded-xl outline-none focus:border-brand-500 resize-none ${errors.address ? 'border-red-500' : 'border-stone-200'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">کد پستی</label>
              <input
                type="text"
                value={form.postal}
                onChange={(e) => update('postal', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
            <h2 className="font-semibold text-lg mb-2">روش ارسال</h2>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 cursor-pointer hover:border-brand-500">
              <input
                type="radio"
                name="shipping"
                value="normal"
                checked={form.shipping === 'normal'}
                onChange={(e) => update('shipping', e.target.value)}
                className="accent-brand-600"
              />
              <div className="flex-1">
                <span className="font-medium text-sm">ارسال عادی</span>
                <p className="text-xs text-stone-500">۲ تا ۴ روز کاری</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 cursor-pointer hover:border-brand-500">
              <input
                type="radio"
                name="shipping"
                value="express"
                checked={form.shipping === 'express'}
                onChange={(e) => update('shipping', e.target.value)}
                className="accent-brand-600"
              />
              <div className="flex-1">
                <span className="font-medium text-sm">ارسال سریع (تهران)</span>
                <p className="text-xs text-stone-500">همان روز / روز بعد</p>
              </div>
            </label>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
            <h2 className="font-semibold text-lg mb-2">روش پرداخت</h2>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="online"
                checked={form.payment === 'online'}
                onChange={(e) => update('payment', e.target.value)}
                className="accent-brand-600"
              />
              <span className="text-sm font-medium">پرداخت آنلاین</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={form.payment === 'cod'}
                onChange={(e) => update('payment', e.target.value)}
                className="accent-brand-600"
              />
              <span className="text-sm font-medium">پرداخت در محل</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {submitting ? 'در حال ثبت...' : 'ثبت سفارش و پرداخت'}
          </button>
        </form>

        <aside className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">خلاصه سفارش</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => {
                const p = item.product || {};
                const img = p.main_image || p.image;
                return (
                  <div key={item.variant_id} className="flex gap-3 text-sm">
                    <img src={img} alt="" className="w-14 h-16 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.title}</p>
                      <p className="text-stone-500">
                        {toPersianDigits(item.quantity)} × {formatPrice(p.final_price || p.price || 0)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <hr className="border-stone-200 my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">جمع جزء</span>
                <span>{formatPrice(cart.subtotal ?? total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">ارسال</span>
                <span>{shippingLabel}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2">
                <span>قابل پرداخت</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}