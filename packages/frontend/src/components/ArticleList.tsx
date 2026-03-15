import { format } from 'date-fns';
import type { Article } from '../api/client';

interface Props {
  articles: Article[];
}

export default function ArticleList({ articles }: Props) {
  if (articles.length === 0) {
    return <p className="text-gray-500 text-sm">Không có bài viết trong báo cáo này.</p>;
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <div
          key={article.id}
          className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-400 hover:text-blue-300 line-clamp-1"
              >
                {article.title}
              </a>
              <div className="flex gap-3 mt-1 text-xs text-gray-500">
                {article.source && <span>{article.source}</span>}
                {article.published && (
                  <span>{format(new Date(article.published), 'MMM d, h:mm a')}</span>
                )}
              </div>
            </div>
          </div>
          {article.summary && (
            <p className="mt-2 text-sm text-gray-400 line-clamp-2">{article.summary}</p>
          )}
        </div>
      ))}
    </div>
  );
}
