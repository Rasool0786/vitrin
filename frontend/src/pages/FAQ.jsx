import { Link } from 'react-router-dom';

const FAQ_ITEMS = [
  {
    q: 'چطور سفارش ثبت کنم؟',
    a: (
      <>محصول را به سبد اضافه کنید، وارد صفحه سبد شوید و روی «ادامه فرآیند خرید» بزنید. آدرس و روش پرداخت را تکمیل کنید تا سفارش ثبت شود.</>
    ),
  },
  {
    q: 'هزینه و زمان ارسال چقدر است؟',
    a: (
      <>سفارش‌های بالای ۲ میلیون تومان ارسال رایگان دارند. تهران معمولاً ۱–۲ روز کاری و شهرستان ۲–۴ روز. جزئیات در صفحه <Link to="/shipping" className="text-brand-600 hover:underline">روش‌های ارسال</Link>.</>
    ),
  },
  {
    q: 'آیا می‌توانم کالا را برگردانم؟',
    a: (
      <>تا ۷ روز پس از دریافت، در صورت سالم بودن کالا و حفظ برچسب، بازگشت ممکن است. شرایط کامل در <Link to="/returns" className="text-brand-600 hover:underline">شرایط بازگشت</Link>.</>
    ),
  },
  {
    q: 'سایز مناسب را چطور انتخاب کنم؟',
    a: (
      <>از جدول <Link to="/guide" className="text-brand-600 hover:underline">راهنمای خرید و سایز</Link> استفاده کنید. اگر بین دو سایز مردد بودید، معمولاً سایز بزرگ‌تر راحت‌تر است.</>
    ),
  },
  {
    q: 'روش‌های پرداخت چیست؟',
    a: <>پرداخت آنلاین از طریق درگاه بانکی امن. اطلاعات کارت روی سرورهای ویترین ذخیره نمی‌شود.</>,
  },
  {
    q: 'چطور سفارش را پیگیری کنم؟',
    a: <>پس از ورود، از داشبورد بخش سفارش‌ها یا دکمه «جزئیات سفارش» وضعیت را ببینید. همچنین می‌توانید با پشتیبانی تماس بگیرید و کد سفارش را اعلام کنید.</>,
  },
  {
    q: 'تخفیف‌ها چگونه اعمال می‌شوند؟',
    a: <>قیمت نهایی روی صفحه محصول و سبد نمایش داده می‌شود. محصولات دارای تخفیف در فیلتر «تخفیف‌ها» فروشگاه قابل مشاهده‌اند.</>,
  },
];

export default function FAQ() {
  return (
    <main>
      <section className="bg-stone-100">
        <div className="max-w-3xl mx-auto px-4 py-12 lg:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">سوالات متداول</h1>
          <p className="text-stone-500">
            پاسخ سریع به پرتکرارترین پرسش‌ها درباره خرید از ویترین
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="faq-item group bg-white rounded-2xl border border-stone-200 open:shadow-sm"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-5 py-4 font-medium text-sm sm:text-base">
                <span>{item.q}</span>
                <span className="text-stone-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                {item.a}
              </div>
            </details>
          ))}

          <div className="mt-10 text-center text-sm text-stone-500">
            پاسخ خود را پیدا نکردید؟{' '}
            <Link to="/contact" className="text-brand-600 font-medium hover:underline">
              با ما تماس بگیرید
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}