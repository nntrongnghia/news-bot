import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchReport, type Report } from '../api/client';
import Synthesis from '../components/Synthesis';
import ArticleList from '../components/ArticleList';
import ErrorBoundary from '../components/ErrorBoundary';
import { format } from 'date-fns';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-gray-800 rounded animate-skeleton ${className ?? ''}`} />;
}

function ReportDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <SkeletonBlock className="h-3 w-24 mb-3" />
        <SkeletonBlock className="h-8 w-64 mb-2" />
        <SkeletonBlock className="h-3 w-48" />
      </div>
      <div className="max-w-4xl space-y-4">
        <SkeletonBlock className="h-3 w-40" />
        <SkeletonBlock className="h-5 w-3/4" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-5/6" />
        <SkeletonBlock className="h-4 w-2/3" />
      </div>
      <div className="space-y-4">
        <SkeletonBlock className="h-3 w-24" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="py-4 space-y-2">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-5 w-5/6" />
            <SkeletonBlock className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchReport(parseInt(id, 10))
      .then((data) => {
        console.log('Report data:', JSON.stringify(data, null, 2));
        setReport(data);
      })
      .catch((err) => {
        console.error('Failed to fetch report:', err);
        setError(err instanceof Error ? err.message : 'Lỗi khi tải báo cáo');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <ReportDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
          Quay lại Bảng Điều Khiển
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Không tìm thấy báo cáo.</p>
        <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
          Quay lại Bảng Điều Khiển
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          &larr; Quay lại
        </Link>
        <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-gray-100 mt-2">
          {report.reportKey}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {format(new Date(report.generatedAt), 'MMMM d, yyyy h:mm a')}
          <span className="mx-1.5">&middot;</span>
          {report.articleCount ?? 0} bài viết
        </p>
      </div>

      {report.synthesis && (
        <section>
          <h2 className="text-xs uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-gray-400 pb-2 border-b-2 border-gray-900 dark:border-gray-100 mb-6">
            Tổng Hợp Thị Trường
          </h2>
          <div className="max-w-4xl">
            <ErrorBoundary>
              <Synthesis synthesis={report.synthesis} />
            </ErrorBoundary>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-gray-400 pb-2 border-b-2 border-gray-900 dark:border-gray-100 mb-6">
          Bài Viết
        </h2>
        <ErrorBoundary>
          <ArticleList articles={report.articles} />
        </ErrorBoundary>
      </section>
    </div>
  );
}
