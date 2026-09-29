import { Link } from 'react-router-dom';

export default function About() {
  return (
    <main>
      {/* Hero */}
      <section className="relative bg-stone-100 overflow-hidden">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-medium tracking-widest text-brand-600 mb-3">
              داستان ما
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight mb-6">
              ویترین؛ ساده، شیک، ماندگار
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed">
              ما باور داریم لباس خوب باید هم زیبا باشد، هم راحت و هم ماندگار.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 lg:py-24">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="aspect-[4/5] rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=700&q=80"
                alt="درباره ویترین"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
                چطور شروع شد
              </h2>
              <p className="text-stone-600 leading-relaxed">
                ویترین از یک ایده ساده شکل گرفت: لباس‌هایی بسازیم که در شلوغی مد روز، آرام و باکیفیت بمانند. لباس‌هایی که بعد از چند فصل هنوز دوست‌داشتنی باشند.
              </p>
              <p className="text-stone-600 leading-relaxed">
                هر قطعه با دقت در انتخاب پارچه، برش و دوخت ساخته می‌شود. ما روی سادگی هوشمندانه، راحتی واقعی و طراحی بی‌زمان تمرکز می‌کنیم — تا استایل شما در هر لحظه کامل باشد.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900 mb-12">
            ارزش‌های ما
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <ValueCard
              icon="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              title="کیفیت"
              desc="انتخاب پارچه و دوخت با وسواس برای دوام بیشتر"
            />
            <ValueCard
              icon="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              title="راحتی"
              desc="لباس باید احساس خوبی به بدن بدهد، نه فقط روی مانکن"
            />
            <ValueCard
              icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              title="ماندگاری"
              desc="طراحی بی‌زمان که چند فصل با شما می‌ماند"
            />
            <ValueCard
              icon="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              title="صداقت"
              desc="قیمت منصفانه و شفافیت در هر جزئیات"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 lg:py-16 border-y border-stone-200">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <StatBox value="۱۰+" label="سال تجربه طراحی" />
            <StatBox value="۵۰۰+" label="مدل در کالکشن" />
            <StatBox value="۲۰ک+" label="مشتری راضی" />
            <StatBox value="۷" label="روز ضمانت بازگشت" />
          </div>
        </div>
      </section>

      {/* How we work */}
      <section className="py-16 lg:py-24">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
              از ایده تا کمد شما
            </h2>
            <p className="mt-2 text-stone-500">
              فرآیند ساخت هر قطعه در ویترین
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              num="۰۱"
              title="طراحی"
              desc="اسکچ‌های اولیه با تمرکز روی برش تمیز، تناسب بدن و جزئیات کاربردی ساخته می‌شوند."
            />
            <StepCard
              num="۰۲"
              title="انتخاب پارچه"
              desc="پارچه‌ها از نظر بافت، تنفس‌پذیری و دوام بررسی می‌شوند تا هم زیبا باشند هم ماندگار."
            />
            <StepCard
              num="۰۳"
              title="دوخت و کنترل کیفیت"
              desc="هر محصول قبل از ارسال از نظر دوخت، سایز و ظاهر بررسی می‌شود تا با استاندارد ما هم‌خوان باشد."
            />
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="py-16 lg:py-24 bg-stone-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 space-y-5">
              <p className="text-sm font-medium tracking-widest text-brand-600">
                تعهد ما
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
                لباسی که با زندگی شما جور باشد
              </h2>
              <p className="text-stone-600 leading-relaxed">
                مد سریع اغلب کیفیت را قربانی سرعت می‌کند. ما خلاف این مسیر حرکت می‌کنیم: کمتر، بهتر، ماندگارتر. هدف‌مان این است که هر خرید، سرمایه‌گذاری روی استایل شخصی شما باشد نه یک تکه مصرفی یک‌فصلی.
              </p>
              <p className="text-stone-600 leading-relaxed">
                از ارسال سریع و بسته‌بندی مرتب تا امکان بازگشت تا ۷ روز، تلاش می‌کنیم تجربه خرید هم به‌اندازه خود لباس، قابل اعتماد باشد.
              </p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <span className="text-brand-600">✓</span> تمرکز روی طراحی مینیمال و کاربردی
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-600">✓</span> قیمت‌گذاری شفاف و منصفانه
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-600">✓</span> پشتیبانی واقعی قبل و بعد از خرید
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2 aspect-[4/5] rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=700&q=80"
                alt="تعهد کیفیت ویترین"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4">
            آماده کشف استایل خود هستید؟
          </h2>
          <p className="text-stone-500 mb-8">
            کالکشن جدید را ببینید و قطعه‌ای را که با شما حرف می‌زند پیدا کنید.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/shop"
              className="inline-flex justify-center px-8 py-3.5 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors"
            >
              مشاهده فروشگاه
            </Link>
            <Link
              to="/contact"
              className="inline-flex justify-center px-8 py-3.5 border border-stone-300 font-medium rounded-full hover:bg-stone-100 transition-colors"
            >
              تماس با ما
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ValueCard({ icon, title, desc }) {
  return (
    <div className="text-center p-6">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-100 flex items-center justify-center text-brand-700">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
        </svg>
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-stone-500">{desc}</p>
    </div>
  );
}

function StatBox({ value, label }) {
  return (
    <div>
      <p className="text-3xl sm:text-4xl font-bold text-stone-900">{value}</p>
      <p className="text-sm text-stone-500 mt-1">{label}</p>
    </div>
  );
}

function StepCard({ num, title, desc }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6">
      <span className="text-3xl font-bold text-brand-600">{num}</span>
      <h3 className="font-semibold text-lg mt-3 mb-2">{title}</h3>
      <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
    </div>
  );
}