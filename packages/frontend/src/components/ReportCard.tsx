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
      className="block py-5 border-b border-neutral-200 dark:border-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-900/30 -mx-2 px-2 transition-colors"
    >
      {synthesis?.outlook && (
        <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 leading-snug line-clamp-2 mb-2">
          {synthesis.outlook}
        </p>
      )}

      <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
        {report.reportKey}
        <span className="mx-1.5">&middot;</span>
        {format(new Date(report.generatedAt), 'MMM d, h:mm a')}
        <span className="mx-1.5">&middot;</span>
        {report.articleCount ?? 0} bài viết
      </p>

      {synthesis?.expertAnalysis && (
        <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2 mt-2">
          {synthesis.expertAnalysis}
        </p>
      )}
    </Link>
  );
}
