import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { API, formatPrice, toPersianDigits } from '../lib/api.js';

const STEPS = ['ثبت سفارش', 'تأیید پرداخت', 'آماده‌سازی', 'ارسال', 'تحویل'];

export default function OrderDetail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, userLoading } = useApp();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) navigate('/login', { replace: true });
  }, [user, userLoading, navigate]);

  useEffect(() => {
    if (!user || !code) return;
    setLoading(true);
    setNotFound(false);
    API.order(code)
      .then(setOrder)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [user, code]);

  if (userLoading || !user) {
    return (
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 min-h-[70vh]">
        <p className="text-stone-500">در حال بارگذاری...</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 min-h-[70vh]">
        <p className="text-stone-500">در حال بارگذاری...</p>
      </main>
    );
  }

  if (notFound || !order) {
    return (
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 min-h-[70vh]">
        <div className="text-center py-16">
          <p className="font-medium mb-4">سفارش یافت نشد.</p>
          <Link to="/dashboard" className="text-brand-600 hover:underline">بازگشت</Link>
        </div>
      </main>
    );
  }

  const date = order.date || order.created_at;
  const status = order.status || 'در حال پردازش';
  const items = order.items || [];
  const activeStep = status === 'تحویل شده' ? 4 : 2;

  return (
    <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 min-h-[70vh]">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-brand-600 mb-6"
      >
        <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        بازگشت به داشبورد
      </Link>

      <div className="max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">{order.code || order.order_code}</h1>
            <p className="text-sm text-stone-500 mt-1">
              {date ? new Date(date).toLocaleDateString('fa-IR', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              }) : ''}
            </p>
          </div>
          <span className="inline-flex text-xs font-medium px-3 py-1.5 rounded-full bg-amber-100 text-amber-800">
            {status}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-stone-100 font-semibold text-sm">
            اقلام سفارش
          </div>
          <div className="divide-y divide-stone-100 px-5">
            {items.length === 0 ? (
              <p className="py-4 text-sm text-stone-500">اقلام ثبت نشده</p>
            ) : (
              items.map((item, i) => {
                const p = item.product || {};
                const img = p.main_image || p.image;
                return (
                  <div key={i} className="flex gap-3 py-4 items-center">
                    <Link to={`/product/${encodeURIComponent(p.slug || p.id)}`}>
                      <img src={img} className="w-16 h-20 object-cover rounded-xl" alt="" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${encodeURIComponent(p.slug || p.id)}`}
                        className="font-medium text-sm hover:text-brand-600"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {toPersianDigits(item.quantity)} عدد
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatPrice((p.final_price || p.price || 0) * item.quantity)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <div className="px-5 py-4 bg-stone-50 flex justify-between items-center">
            <span className="text-sm text-stone-500">مبلغ کل</span>
            <span className="font-bold text-lg">{formatPrice(order.total || 0)}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h3 className="font-semibold mb-2">وضعیت ارسال</h3>
            <ol className="space-y-2 text-stone-500">
              {STEPS.map((s, i) => {
                const isDone = i <= activeStep;
                return (
                  <li
                    key={s}
                    className={`flex gap-2 items-center ${isDone ? 'text-stone-800 font-medium' : ''}`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        isDone ? 'bg-brand-600 text-white' : 'bg-stone-200'
                      }`}
                    >
                      {toPersianDigits(i + 1)}
                    </span>
                    {s}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h3 className="font-semibold mb-2">پشتیبانی</h3>
            <p className="text-stone-500 mb-3">
              سوالی درباره این سفارش دارید؟
            </p>
            <Link to="/contact" className="text-brand-600 hover:underline">
              تماس با پشتیبانی
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}