import { Link } from 'react-router-dom';

export default function Shipping() {
  return (
    <main>
      <section className="bg-stone-100">
        <div className="max-w-3xl mx-auto px-4 py-12 lg:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">روش‌های ارسال</h1>
          <p className="text-stone-500">ارسال سریع و مطمئن به سراسر کشور</p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h3 className="font-semibold text-lg mb-2">ارسال عادی</h3>
              <p className="text-sm text-stone-500 mb-3">
                تهران: ۱–۲ روز کاری<br />شهرستان: ۲–۴ روز کاری
              </p>
              <p className="text-sm">
                هزینه بر اساس وزن و مقصد محاسبه می‌شود. بالای ۲ میلیون تومان:{' '}
                <strong className="text-brand-600">رایگان</strong>
              </p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h3 className="font-semibold text-lg mb-2">ارسال سریع (تهران)</h3>
              <p className="text-sm text-stone-500 mb-3">
                تحویل همان روز یا روز بعد (در ساعات اداری)
              </p>
              <p className="text-sm">برای سفارش‌های ثبت‌شده تا ساعت ۱۲ ظهر در محدوده پوشش پیک.</p>
            </div>
          </div>

          <div className="text-stone-600 leading-relaxed space-y-4 text-sm">
            <p>
              پس از آماده‌سازی سفارش، کد رهگیری برای شما پیامک می‌شود. بسته‌بندی با دقت انجام می‌شود تا کالا سالم به دست شما برسد.
            </p>
            <p>در صورت تأخیر غیرعادی، با پشتیبانی تماس بگیرید تا وضعیت را بررسی کنیم.</p>
          </div>

          <Link
            to="/faq"
            className="inline-flex text-brand-600 font-medium hover:underline"
          >
            سوالات متداول درباره ارسال ←
          </Link>
        </div>
      </section>
    </main>
  );
}