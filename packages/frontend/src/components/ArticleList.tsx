import { useState } from 'react';
import { format } from 'date-fns';
import type { Article } from '../api/client';

interface Props {
  articles: Article[];
}

export default function ArticleList({ articles }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (articles.length === 0) {
    return <p className="text-gray-400 dark:text-gray-500 text-sm">Không có bài viết trong báo cáo này.</p>;
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => {
        const isExpanded = expandedId === article.id;

        return (
          <div
            key={article.id}
            className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
          >
            <div
              className="flex items-start justify-between gap-4 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : article.id)}
            >
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                  {article.title}
                </h4>
                <div className="flex gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {article.source && <span>{article.source}</span>}
                  {article.published && (
                    <span>{format(new Date(article.published), 'MMM d, h:mm a')}</span>
                  )}
                </div>
              </div>
              <svg
                className={`w-4 h-4 mt-1 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {!isExpanded && article.summary && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{article.summary}</p>
            )}

            {isExpanded && (
              <div className="mt-3 space-y-3">
                {article.content && (
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line max-h-96 overflow-y-auto border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                    {article.content}
                  </div>
                )}
                {article.summary && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    <span className="font-medium not-italic text-gray-600 dark:text-gray-300">Tóm tắt:</span> {article.summary}
                  </div>
                )}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
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
