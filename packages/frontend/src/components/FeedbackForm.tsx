import { useState, useEffect, useRef } from 'react';
import { submitFeedback } from '../api/client';

const CATEGORIES = [
  { value: '', label: 'Chọn danh mục (tùy chọn)' },
  { value: 'suggestion', label: 'Góp ý' },
  { value: 'bug', label: 'Báo lỗi' },
  { value: 'content', label: 'Yêu cầu nội dung' },
  { value: 'other', label: 'Khác' },
];

export default function FeedbackModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  function close() {
    setOpen(false);
    if (success) setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError('Vui lòng nhập nội dung phản hồi.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitFeedback({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        category: category || undefined,
        message: message.trim(),
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setCategory('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi phản hồi thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500';

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Gửi phản hồi"
        className="fixed bottom-4 right-4 z-40 flex items-center justify-center p-2.5 sm:gap-2 sm:px-4 sm:py-2.5 bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-medium rounded-full shadow-lg hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
          <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0 1 10 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 0 1-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 0 1-1.33 0l-1.713-3.293a.783.783 0 0 0-.642-.413 41.108 41.108 0 0 1-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902Z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:block">Phản hồi</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          ref={overlayRef}
          onClick={(e) => e.target === overlayRef.current && close()}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-800">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-800 dark:text-neutral-200">
                Gửi phản hồi
              </h2>
              <button
                onClick={close}
                className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                aria-label="Đóng"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5">
              {success ? (
                <div className="py-6 text-center">
                  <p className="text-neutral-800 dark:text-neutral-200 font-medium mb-2">
                    Cảm ơn bạn đã gửi phản hồi!
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="text-sm text-neutral-600 dark:text-neutral-400 underline hover:text-neutral-900 dark:hover:text-neutral-100"
                  >
                    Gửi phản hồi khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Tên (tùy chọn)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="email"
                      placeholder="Email (tùy chọn)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    placeholder="Nội dung phản hồi *"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={5000}
                    required
                    className={`${inputClass} resize-vertical`}
                  />
                  {error && (
                    <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                  )}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={close}
                      className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 text-sm font-medium bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
