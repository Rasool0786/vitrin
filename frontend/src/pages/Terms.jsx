import { Link } from 'react-router-dom';

const ARTICLES = [
  {
    title: '۱. حساب کاربری',
    body: <>مسئولیت صحت اطلاعات ثبت‌شده و حفظ رمز عبور بر عهده کاربر است. استفاده از حساب دیگران بدون مجوز ممنوع است. در صورت سوءاستفاده، دسترسی ممکن است محدود شود.</>,
  },
  {
    title: '۲. قیمت، موجودی و سفارش',
    body: <>قیمت‌ها ممکن است تغییر کنند. سفارش پس از تأیید پرداخت قطعی محسوب می‌شود. در صورت خطای آشکار قیمت یا اتمام موجودی، فروشگاه حق لغو دارد و مبلغ بازگردانده می‌شود.</>,
  },
  {
    title: '۳. ارسال و تحویل',
    body: <>زمان و هزینه ارسال طبق صفحه <Link to="/shipping" className="text-brand-600 hover:underline">روش‌های ارسال</Link> اعلام می‌شود. تأخیر ناشی از شرکت حمل یا شرایط خارج از کنترل، تعهدی فراتر از اطلاع‌رسانی و پیگیری ندارد.</>,
  },
  {
    title: '۴. بازگشت کالا',
    body: <>شرایط در <Link to="/returns" className="text-brand-600 hover:underline">صفحه بازگشت کالا</Link> آمده است. کالاهای استفاده‌شده یا بدون برچسب معمولاً قابل بازگشت نیستند مگر معیوب بودن از سمت فروشگاه محرز شود.</>,
  },
  {
    title: '۵. مالکیت فکری و محدودیت مسئولیت',
    body: <>نام تجاری، لوگو و محتوای سایت متعلق به ویترین است. فروشگاه در حد امکانات معقول برای صحت اطلاعات تلاش می‌کند؛ انتخاب اشتباه سایز یا استفاده نادرست بر عهده خریدار است مگر خلاف آن ثابت شود.</>,
  },
  {
    title: '۶. حریم خصوصی و تغییرات',
    body: <>پردازش داده‌ها طبق <Link to="/privacy" className="text-brand-600 hover:underline">سیاست حریم خصوصی</Link> است. فروشگاه می‌تواند این متن را به‌روز کند؛ نسخه منتشرشده در همین صفحه معتبر است.</>,
  },
];

export default function Terms() {
  return (
    <main>
      <section className="bg-stone-100">
        <div className="max-w-3xl mx-auto px-4 py-12 lg:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">قوانین و مقررات</h1>
          <p className="text-stone-500">
            شرایط استفاده از وب‌سایت و خرید از ویترین
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8 text-stone-600 leading-relaxed">
          <p className="text-base">
            با ورود به سایت، ثبت‌نام یا ثبت سفارش، این شرایط را می‌پذیرید. لطفاً پیش از خرید مطالعه کنید.
          </p>

          {ARTICLES.map((a) => (
            <article
              key={a.title}
              className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3"
            >
              <h2 className="text-lg font-bold text-stone-900">{a.title}</h2>
              <p>{a.body}</p>
            </article>
          ))}

          <p className="text-xs text-stone-400">
            آخرین به‌روزرسانی: فروردین ۱۴۰۵ ·{' '}
            <Link to="/contact" className="hover:underline">تماس با ما</Link>
          </p>
        </div>
      </section>
    </main>
  );
}