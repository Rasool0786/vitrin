import { useApp } from '../contexts/AppContext.jsx';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div
      id="toast-container"
      className="fixed bottom-6 left-6 z-[70] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            'toast flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium max-w-sm pointer-events-auto ' +
            (t.type === 'success'
              ? 'bg-stone-900 text-white'
              : 'bg-red-600 text-white')
          }
        >
          <span>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="opacity-70 hover:opacity-100 mr-auto"
            aria-label="بستن"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}