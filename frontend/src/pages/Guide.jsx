import { Link } from 'react-router-dom';

const STEPS = [
  { num: '۱', title: 'انتخاب محصول', desc: 'از فروشگاه فیلتر کنید، جزئیات و نظرات را ببینید، سایز و رنگ را مشخص کنید.' },
  { num: '۲', title: 'سبد و تسویه', desc: 'تعداد را تنظیم کنید، به تسویه بروید و آدرس تحویل را وارد کنید.' },
  { num: '۳', title: 'پرداخت و پیگیری', desc: 'پس از پرداخت، کد سفارش در داشبورد و جزئیات سفارش قابل مشاهده است.' },
];

const SIZE_TABLE = [
  { size: 'S',  chest: '۸۸–۹۲',    waist: '۷۰–۷۴', hips: '۹۴–۹۸' },
  { size: 'M',  chest: '۹۲–۹۶',    waist: '۷۴–۷۸', hips: '۹۸–۱۰۲' },
  { size: 'L',  chest: '۹۶–۱۰۰',   waist: '۷۸–۸۲', hips: '۱۰۲–۱۰۶' },
  { size: 'XL', chest: '۱۰۰–۱۰۶', waist: '۸۲–۸۸', hips: '۱۰۶–۱۱۲' },
];

export default function Guide() {
  return (
    <main>
      <section className="bg-stone-100">
        <div className="max-w-3xl mx-auto px-4 py-12 lg:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">راهنمای خرید</h1>
          <p className="text-stone-500">
            از انتخاب سایز تا دریافت سفارش — قدم‌به‌قدم
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
          <div>
            <h2 className="text-xl font-bold mb-4">مراحل خرید</h2>
            <ol className="space-y-4">
              {STEPS.map((s) => (
                <li
                  key={s.num}
                  className="flex gap-4 bg-white rounded-2xl border border-stone-200 p-5"
                >
                  <span className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">
                    {s.num}
                  </span>
                  <div>
                    <p className="font-semibold mb-1">{s.title}</p>
                    <p className="text-sm text-stone-500">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">راهنمای تقریبی سایز</h2>
            <p className="text-sm text-stone-500 mb-4">
              اعداد به‌صورت حدودی است؛ برای بهترین نتیجه به جدول روی محصول هم توجه کنید.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-sm text-center">
                <thead className="bg-stone-100">
                  <tr>
                    <th className="py-3 px-2 font-semibold">سایز</th>
                    <th className="py-3 px-2 font-semibold">دور سینه (سانتی‌متر)</th>
                    <th className="py-3 px-2 font-semibold">دور کمر</th>
                    <th className="py-3 px-2 font-semibold">دور باسن</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-100">
                  {SIZE_TABLE.map((r) => (
                    <tr key={r.size}>
                      <td className="py-2.5 font-medium">{r.size}</td>
                      <td className="py-2.5">{r.chest}</td>
                      <td className="py-2.5">{r.waist}</td>
                      <td className="py-2.5">{r.hips}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-brand-50 rounded-2xl p-6 text-sm">
            <p className="font-semibold mb-2">نکته مراقبت از لباس</p>
            <p className="text-stone-600 leading-relaxed">
              شستشو با آب سرد، خشک‌کردن در سایه و پرهیز از حرارت مستقیم اتو روی چاپ یا گلدوزی، عمر لباس را بیشتر می‌کند.
            </p>
          </div>

          <div className="text-center">
            <Link
              to="/shop"
              className="inline-flex px-8 py-3.5 bg-stone-900 text-white font-medium rounded-full"
            >
              شروع خرید
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}