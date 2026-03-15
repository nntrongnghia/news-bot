import { useState } from 'react';
import { format } from 'date-fns';
import type { Article } from '../api/client';

interface Props {
  articles: Article[];
}

export default function ArticleList({ articles }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (articles.length === 0) {
    return <p className="text-neutral-500 dark:text-neutral-400 text-base">Không có bài viết trong báo cáo này.</p>;
  }

  return (
    <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {articles.map((article) => {
        const isExpanded = expandedId === article.id;

        return (
          <div key={article.id} className="py-4 first:pt-0">
            <div
              className="flex items-start justify-between gap-4 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : article.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  {article.source && (
                    <span className="text-[11px] uppercase tracking-[0.1em] font-semibold text-neutral-500 dark:text-neutral-400">
                      {article.source}
                    </span>
                  )}
                  {article.published && (
                    <span className="text-[13px] text-neutral-500 dark:text-neutral-400">
                      {format(new Date(article.published), 'MMM d, h:mm a')}
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-semibold leading-snug text-neutral-800 dark:text-neutral-200 line-clamp-2">
                  {article.title}
                </h4>
              </div>
              <svg
                className={`w-4 h-4 mt-2 text-neutral-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {!isExpanded && article.summary && (
              <p className="mt-1.5 text-base text-neutral-500 dark:text-neutral-400 line-clamp-2 max-w-[65ch] leading-relaxed">
                {article.summary}
              </p>
            )}

            {isExpanded && (
              <div className="mt-3 space-y-3">
                {article.content && (
                  <div className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line max-h-[32rem] overflow-y-auto max-w-[65ch]">
                    {article.content}
                  </div>
                )}
                {article.summary && (
                  <div className="text-base text-neutral-500 dark:text-neutral-400 italic max-w-[65ch]">
                    <span className="font-medium not-italic text-neutral-600 dark:text-neutral-300">Tóm tắt:</span> {article.summary}
                  </div>
                )}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  Đọc bài gốc
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
