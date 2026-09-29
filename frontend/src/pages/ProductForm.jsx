import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { API, formatPrice } from '../lib/api.js';

const CATEGORIES = [
  { value: '',         label: 'انتخاب کنید' },
  { value: 'زنانه',    label: 'زنانه' },
  { value: 'مردانه',   label: 'مردانه' },
  { value: 'روزمره',   label: 'روزمره' },
  { value: 'رسمی',     label: 'رسمی' },
  { value: 'اکسسوری',  label: 'اکسسوری' },
  { value: 'کفش',      label: 'کفش' },
];

const EMPTY_FORM = {
  name: '',
  category: '',
  price: '',
  originalPrice: '',
  image: '',
  description: '',
  isNew: false,
  isBestseller: false,
};

function calcDiscount(price, original) {
  const p = Number(price);
  const o = Number(original);
  if (!o || o <= p) return 0;
  return Math.round(((o - p) / o) * 100);
}

export default function ProductForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast, user, userLoading } = useApp();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editSlug, setEditSlug] = useState(null);
  const [saving, setSaving] = useState(false);

  const [myProducts, setMyProducts] = useState([]);
  const [myLoading, setMyLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) navigate('/login', { replace: true });
  }, [user, userLoading, navigate]);

  const loadMyProducts = () => {
    setMyLoading(true);
    API.products({ mine: true, page_size: 100 })
      .then((data) => setMyProducts(data.results || data || []))
      .catch(() => setMyProducts([]))
      .finally(() => setMyLoading(false));
  };

  useEffect(() => {
    if (user) loadMyProducts();
     
  }, [user]);

  useEffect(() => {
    const slug = searchParams.get('slug');
    if (!slug || !user) return;
    API.product(slug)
      .then((p) => {
        setEditSlug(p.slug);
        setForm({
          name: p.title || '',
          category: p.category?.name || '',
          price: p.price || '',
          originalPrice: p.original_price || '',
          image: p.main_image || '',
          description: p.description || '',
          isNew: !!p.is_new,
          isBestseller: !!p.is_bestseller,
        });
      })
      .catch(() => {});
  }, [searchParams, user]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditSlug(null);
  };

  const handleEdit = (slug) => {
    API.product(slug)
      .then((p) => {
        setEditSlug(p.slug);
        setForm({
          name: p.title || '',
          category: p.category?.name || '',
          price: p.price || '',
          originalPrice: p.original_price || '',
          image: p.main_image || '',
          description: p.description || '',
          isNew: !!p.is_new,
          isBestseller: !!p.is_bestseller,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch((err) => showToast(err.message || 'خطا در بارگذاری محصول.', 'error'));
  };

  const handleDelete = async (slug) => {
    if (!confirm('این محصول حذف شود؟')) return;
    try {
      await API.deleteProduct(slug);
      showToast('محصول حذف شد.');
      loadMyProducts();
      if (editSlug === slug) resetForm();
    } catch (err) {
      showToast(err.message || 'خطا در حذف محصول.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = form.name.trim();
    const category = form.category;
    const price = Number(form.price);
    const original = Number(form.originalPrice) || null;

    if (!name || !category || !price) {
      showToast('نام، دسته و قیمت الزامی است.', 'error');
      return;
    }

    const payload = {
      title: name,
      category,
      price,
      original_price: original,
      discount: calcDiscount(price, original),
      main_image: form.image.trim() || undefined,
      description: form.description.trim() || undefined,
      is_new: form.isNew,
      is_bestseller: form.isBestseller,
    };

    setSaving(true);
    try {
      if (editSlug) {
        await API.updateProduct(editSlug, payload);
        showToast('محصول بروزرسانی شد.');
      } else {
        await API.createProduct(payload);
        showToast('محصول با موفقیت اضافه شد.');
      }
      resetForm();
      loadMyProducts();
    } catch (err) {
      showToast(err.message || 'خطا در ذخیره محصول.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || !user) {
    return (
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <p className="text-stone-500">در حال بارگذاری...</p>
      </main>
    );
  }

  return (
    <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 max-w-2xl">
          <h1 className="text-2xl font-bold mb-2">
            {editSlug ? 'ویرایش محصول' : 'افزودن محصول جدید'}
          </h1>
          <p className="text-sm text-stone-500 mb-8">
            محصولات از طریق API ثبت می‌شوند.
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 bg-white rounded-2xl border border-stone-200 p-6"
            noValidate
          >
            <div>
              <label htmlFor="p-name" className="block text-sm font-medium mb-1.5">نام محصول *</label>
              <input
                id="p-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                placeholder="مثلاً کت لینن کلاسیک"
              />
            </div>

            <div>
              <label htmlFor="p-category" className="block text-sm font-medium mb-1.5">دسته‌بندی *</label>
              <select
                id="p-category"
                required
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="p-price" className="block text-sm font-medium mb-1.5">قیمت (تومان) *</label>
                <input
                  id="p-price"
                  type="number"
                  required
                  min="0"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                  placeholder="1450000"
                />
              </div>
              <div>
                <label htmlFor="p-original" className="block text-sm font-medium mb-1.5">قیمت قبل تخفیف</label>
                <input
                  id="p-original"
                  type="number"
                  min="0"
                  value={form.originalPrice}
                  onChange={(e) => update('originalPrice', e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                  placeholder="اختیاری"
                />
              </div>
            </div>

            <div>
              <label htmlFor="p-image" className="block text-sm font-medium mb-1.5">آدرس تصویر (URL)</label>
              <input
                id="p-image"
                type="url"
                value={form.image}
                onChange={(e) => update('image', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label htmlFor="p-description" className="block text-sm font-medium mb-1.5">توضیحات</label>
              <textarea
                id="p-description"
                rows={4}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-brand-500 resize-none"
                placeholder="توضیح کوتاه محصول..."
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(e) => update('isNew', e.target.checked)}
                  className="accent-brand-600 rounded"
                />
                <span>محصول جدید</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isBestseller}
                  onChange={(e) => update('isBestseller', e.target.checked)}
                  className="accent-brand-600 rounded"
                />
                <span>پرفروش</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'در حال ذخیره...' : (editSlug ? 'بروزرسانی' : 'ذخیره محصول')}
              </button>
              {editSlug && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-stone-200 rounded-full text-sm hover:bg-stone-100"
                >
                  انصراف از ویرایش
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:w-96">
          <h2 className="font-semibold mb-4">محصولات اضافه‌شده شما</h2>

          {myLoading ? (
            <p className="text-sm text-stone-500 py-6 text-center">در حال بارگذاری...</p>
          ) : myProducts.length === 0 ? (
            <p className="text-sm text-stone-500 py-6 text-center border border-dashed border-stone-200 rounded-2xl">
              هنوز محصولی اضافه نکرده‌اید.
            </p>
          ) : (
            <div className="space-y-3">
              {myProducts.map((p) => {
                const img = p.main_image || 'https://via.placeholder.com/100';
                return (
                  <div
                    key={p.id}
                    className="bg-white border border-stone-200 rounded-xl p-3 flex gap-3"
                  >
                    <img src={img} alt="" className="w-14 h-16 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.title}</p>
                      <p className="text-xs text-stone-500">
                        {p.category?.name || ''} · {formatPrice(p.price)}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(p.slug)}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          ویرایش
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.slug)}
                          className="text-xs text-rose-600 hover:underline"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-stone-400 mt-4">
            مدیریت محصولات از طریق API انجام می‌شود.
          </p>
        </div>
      </div>
    </main>
  );
}