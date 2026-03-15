import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import type { Report } from '../api/client';

interface Props {
  report: Report;
}

export default function ReportCard({ report }: Props) {
  const synthesis = report.synthesis;

  return (
    <Link
      to={`/reports/${report.id}`}
      className="block border border-gray-200 dark:border-gray-800 rounded-lg p-5 hover:border-amber-500/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{report.reportKey}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {format(new Date(report.generatedAt), 'MMM d, h:mm a')}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {report.articleCount ?? 0} bài viết
        </span>
      </div>

      {synthesis?.outlook && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{synthesis.outlook}</p>
      )}

      {synthesis?.expertAnalysis && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic line-clamp-2 mt-2">
          {synthesis.expertAnalysis}
        </p>
      )}

      {synthesis?.keyDevelopments && synthesis.keyDevelopments.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-amber-400 font-semibold mb-1">Diễn Biến Nổi Bật</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {synthesis.keyDevelopments[0]}
          </p>
        </div>
      )}
    </Link>
  );
}
