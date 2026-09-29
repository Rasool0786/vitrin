import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { API, formatPrice, toPersianDigits } from '../lib/api.js';

export default function Orders() {
  const navigate = useNavigate();
  const { user, userLoading } = useApp();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) navigate('/login', { replace: true });
  }, [user, userLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    API.orders()
      .then((data) => setOrders(data.results || data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (userLoading || !user) {
    return (
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 min-h-[70vh]">
        <p className="text-stone-500">در حال بارگذاری...</p>
      </main>
    );
  }

  return (
    <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 min-h-[70vh]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">سفارش‌های من</h1>
          <p className="text-sm text-stone-500 mt-1">
            <span>{toPersianDigits(orders.length)}</span> سفارش ثبت‌شده
          </p>
        </div>
        <Link to="/shop" className="text-sm text-brand-600 font-medium hover:underline">
          ادامه خرید
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-stone-500 py-8 text-center">در حال بارگذاری...</p>
      )}

      {!loading && orders.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
          <svg className="w-14 h-14 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-medium mb-2">هنوز سفارشی ندارید</p>
          <p className="text-sm text-stone-500 mb-6">پس از خرید از فروشگاه، سفارش‌ها اینجا نمایش داده می‌شوند.</p>
          <Link to="/shop" className="inline-flex px-6 py-3 bg-stone-900 text-white font-medium rounded-full text-sm">
            رفتن به فروشگاه
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((o) => {
          const code = o.code || o.order_code;
          const date = o.date || o.created_at;
          const status = o.status || 'در حال پردازش';
          const items = o.items || [];
          const statusColor =
            status === 'تحویل شده'
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-800';

          return (
            <article
              key={code || o.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 bg-stone-50/80">
                <div>
                  <p className="font-semibold text-sm">{code}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {date ? new Date(date).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
                    {status}
                  </span>
                  <span className="font-semibold text-sm">{formatPrice(o.total || 0)}</span>
                </div>
              </div>

              <div className="px-5 py-3 divide-y divide-stone-100">
                {items.length === 0 ? (
                  <p className="text-sm text-stone-500 py-2">جزئیات اقلام در دسترس نیست</p>
                ) : (
                  items.map((item, i) => {
                    const p = item.product || {};
                    const img = p.main_image || p.image;
                    return (
                      <div key={i} className="flex gap-3 items-center py-2">
                        <img src={img} alt="" className="w-12 h-14 object-cover rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.title}</p>
                          <p className="text-xs text-stone-500">
                            {toPersianDigits(item.quantity)} عدد · {formatPrice(p.final_price || p.price || 0)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-5 py-3 border-t border-stone-100 text-right">
                <Link
                  to={`/orders/${encodeURIComponent(code)}`}
                  className="inline-flex text-xs font-medium px-3 py-1.5 rounded-full bg-stone-900 text-white hover:opacity-90"
                >
                  جزئیات سفارش
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}