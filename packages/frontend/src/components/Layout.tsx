import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useTheme } from '../hooks/useTheme';

function formatDate() {
  return new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#141414] text-neutral-800 dark:text-neutral-200 font-sans">
      <header className="border-b-2 border-neutral-800 dark:border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <Link to="/" className="text-2xl font-serif font-bold tracking-[-0.01em] text-neutral-800 dark:text-neutral-200">
              Tin tức xăng dầu
            </Link>
            <p className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Tổng hợp tin tức, phân tích thị trường xăng dầu Việt Nam và thế giới
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-neutral-500 dark:text-neutral-400 hidden sm:block">
              {formatDate()}
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-900 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.06 1.06l1.06 1.06Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
