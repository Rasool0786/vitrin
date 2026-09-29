import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { API, formatPrice, toPersianDigits } from '../lib/api.js';
import ProductCard from '../components/ProductCard.jsx';

const SECTIONS = [
  { key: 'overview', label: 'خلاصه' },
  { key: 'orders',   label: 'سفارش‌ها' },
  { key: 'profile',  label: 'اطلاعات حساب' },
  { key: 'security', label: 'امنیت' },
  { key: 'wishlist', label: 'علاقه‌مندی‌ها' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    user, userLoading, setUser, showToast,
    cart, wishlistIds,
  } = useApp();

  const [active, setActive] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [wishProducts, setWishProducts] = useState([]);

  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', address: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ p1: '', p2: '' });

  useEffect(() => {
    if (!userLoading && !user) navigate('/login', { replace: true });
  }, [user, userLoading, navigate]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    API.orders()
      .then((data) => setOrders(data.results || data || []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  useEffect(() => {
    if (active !== 'wishlist' || !user) return;
    if (wishlistIds.size === 0) { setWishProducts([]); return; }
    API.products({ page_size: 200 })
      .then((data) => {
        const all = data.results || data;
        setWishProducts(all.filter((p) => wishlistIds.has(p.id)));
      })
      .catch(() => setWishProducts([]));
  }, [active, wishlistIds, user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await API.updateProfile({
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        address: profile.address.trim(),
      });
      setUser(updated || { ...user, ...profile });
      showToast('اطلاعات حساب ذخیره شد.');
    } catch (err) {
      showToast(err.message || 'خطا در ذخیره اطلاعات.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (passwords.p1.length < 6) { showToast('رمز حداقل ۶ کاراکتر باشد.', 'error'); return; }
    if (passwords.p1 !== passwords.p2) { showToast('تکرار رمز مطابقت ندارد.', 'error'); return; }
    try {
      await API.changePassword({ password: passwords.p1 });
      setPasswords({ p1: '', p2: '' });
      showToast('رمز عبور بروزرسانی شد.');
    } catch (err) {
      showToast(err.message || 'خطا در تغییر رمز.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('آیا از حذف حساب کاربری مطمئن هستید؟')) return;
    try {
      await API.deleteAccount();
      setUser(null);
      showToast('حساب حذف شد.');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      showToast(err.message || 'خطا در حذف حساب.', 'error');
    }
  };

  if (userLoading || !user) {
    return (
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <p className="text-stone-500">در حال بارگذاری...</p>
      </main>
    );
  }

  const cartCount = cart.items.reduce((s, i) => s + (i.quantity || 1), 0);

  return (
    <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-56 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-stone-200 p-3 space-y-1 lg:sticky lg:top-24">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActive(s.key)}
                className={
                  'dash-nav w-full text-right px-4 py-2.5 text-sm rounded-xl font-medium transition-colors ' +
                  (active === s.key
                    ? 'bg-stone-100 text-stone-900'
                    : 'hover:bg-stone-100')
                }
              >
                {s.label}
              </button>
            ))}
            <Link
              to="/product-form"
              className="block w-full text-right px-4 py-2.5 text-sm rounded-xl font-medium hover:bg-stone-100"
            >
              مدیریت محصولات
            </Link>
            <Link
              to="/logout"
              className="block w-full text-right px-4 py-2.5 text-sm rounded-xl font-medium text-rose-600 hover:bg-rose-50"
            >
              خروج
            </Link>
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          {active === 'overview' && (
            <section>
              <h1 className="text-2xl font-bold mb-1">
                سلام، <span>{user.name || 'کاربر'}</span>
              </h1>
              <p className="text-sm text-stone-500 mb-8">{user.email}</p>

              <div className="grid sm:grid-cols-3 gap-4 mb-10">
                <StatCard label="سفارش‌ها" value={toPersianDigits(orders.length)} />
                <StatCard label="علاقه‌مندی‌ها" value={toPersianDigits(wishlistIds.size)} />
                <StatCard label="سبد خرید" value={toPersianDigits(cartCount)} />
              </div>

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">آخرین سفارش‌ها</h2>
                <button
                  type="button"
                  onClick={() => setActive('orders')}
                  className="text-sm text-brand-600 hover:underline"
                >
                  مشاهده همه
                </button>
              </div>

              <OrdersPreview orders={orders.slice(0, 3)} />
            </section>
          )}

          {active === 'orders' && (
            <section>
              <h2 className="text-xl font-bold mb-6">همه سفارش‌ها</h2>
              {ordersLoading ? (
                <p className="text-sm text-stone-500 py-8 text-center">در حال بارگذاری...</p>
              ) : orders.length === 0 ? (
                <div className="text-sm text-stone-500 py-8 text-center bg-white rounded-2xl border border-stone-200">
                  هنوز سفارشی ثبت نکرده‌اید.
                  <Link to="/shop" className="block mt-2 text-brand-600 hover:underline">
                    شروع خرید
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => <OrderCard key={o.code || o.id} order={o} />)}
                </div>
              )}
            </section>
          )}

          {active === 'profile' && (
            <section>
              <h2 className="text-xl font-bold mb-6">ویرایش اطلاعات حساب</h2>
              <form
                onSubmit={handleSaveProfile}
                className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 max-w-lg"
              >
                <div>
                  <label className="block text-sm font-medium mb-1.5">نام نمایشی</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">ایمیل</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">شماره موبایل</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                    placeholder="۰۹۱۲..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">آدرس پیش‌فرض</label>
                  <textarea
                    rows={2}
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 bg-stone-900 text-white font-medium rounded-full text-sm disabled:opacity-50"
                >
                  {savingProfile ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
              </form>
            </section>
          )}

          {active === 'wishlist' && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">علاقه‌مندی‌های من</h2>
                <Link to="/shop" className="text-sm text-brand-600 hover:underline">
                  ادامه خرید
                </Link>
              </div>

              {wishProducts.length === 0 ? (
                <p className="text-sm text-stone-500 py-10 text-center bg-white rounded-2xl border border-stone-200">
                  لیست علاقه‌مندی خالی است.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {wishProducts.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </section>
          )}

          {active === 'security' && (
            <section>
              <h2 className="text-xl font-bold mb-6">امنیت حساب</h2>
              <div className="space-y-6 max-w-lg">
                <form
                  onSubmit={handlePassword}
                  className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4"
                >
                  <h3 className="font-semibold text-sm">تغییر رمز عبور</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">رمز جدید</label>
                    <input
                      type="password"
                      minLength={6}
                      value={passwords.p1}
                      onChange={(e) => setPasswords({ ...passwords, p1: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">تکرار رمز جدید</label>
                    <input
                      type="password"
                      minLength={6}
                      value={passwords.p2}
                      onChange={(e) => setPasswords({ ...passwords, p2: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-stone-900 text-white font-medium rounded-full text-sm"
                  >
                    بروزرسانی رمز
                  </button>
                </form>

                <div className="bg-white rounded-2xl border border-rose-200 p-6">
                  <h3 className="font-semibold text-sm text-rose-600 mb-2">حذف حساب کاربری</h3>
                  <p className="text-sm text-stone-500 mb-4">
                    با حذف حساب، اطلاعات ورود شما پاک می‌شود.
                  </p>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-6 py-3 bg-rose-600 text-white font-medium rounded-full text-sm hover:bg-rose-700"
                  >
                    حذف دائمی حساب
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <p className="text-sm text-stone-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function OrdersPreview({ orders }) {
  if (!orders.length) {
    return (
      <p className="text-sm text-stone-500">
        سفارشی نیست.{' '}
        <Link to="/shop" className="text-brand-600 hover:underline">خرید کنید</Link>
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {orders.map((o) => <OrderCard key={o.code || o.id} order={o} />)}
    </div>
  );
}

function OrderCard({ order }) {
  const date = order.date || order.created_at;
  const status = order.status || 'در حال پردازش';
  const code = order.code || order.order_code;
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <p className="font-medium text-sm">{code}</p>
        <p className="text-xs text-stone-500 mt-0.5">
          {date ? new Date(date).toLocaleDateString('fa-IR') : ''} · {status}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-semibold text-sm">{formatPrice(order.total || 0)}</p>
        <Link
          to={`/orders/${encodeURIComponent(code)}`}
          className="text-xs font-medium px-3 py-1.5 rounded-full bg-stone-900 text-white hover:opacity-90"
        >
          جزئیات سفارش
        </Link>
      </div>
    </div>
  );
}