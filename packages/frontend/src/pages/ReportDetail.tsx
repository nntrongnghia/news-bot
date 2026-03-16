import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchReport, type Report } from '../api/client';
import Synthesis from '../components/Synthesis';
import ArticleList from '../components/ArticleList';
import ErrorBoundary from '../components/ErrorBoundary';
import { format } from 'date-fns';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-neutral-200 dark:bg-neutral-800 rounded animate-skeleton ${className ?? ''}`} />;
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
        <Link to="/" className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200">
          Quay lại Bảng Điều Khiển
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-700 dark:text-neutral-300 mb-4">Không tìm thấy báo cáo.</p>
        <Link to="/" className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200">
          Quay lại Bảng Điều Khiển
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <Link to="/" className="text-[13px] text-neutral-700 dark:text-neutral-300 hover:text-neutral-600 dark:hover:text-neutral-300">
          &larr; Quay lại
        </Link>
        <h1 className="font-serif text-3xl font-bold tracking-[-0.01em] text-neutral-800 dark:text-neutral-200 mt-2">
          {report.synthesis?.title || report.reportKey}
        </h1>
        <p className="text-[13px] text-neutral-700 dark:text-neutral-300 mt-1">
          {format(new Date(report.generatedAt), 'HH:mm dd/MM/yyyy')}
          <span className="mx-1.5">&middot;</span>
          {report.articleCount ?? 0} bài viết
        </p>
      </div>

      {report.synthesis && (
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.1em] font-semibold text-neutral-700 dark:text-neutral-300 pb-2 border-b-2 border-neutral-800 dark:border-neutral-200 mb-6">
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
        <h2 className="text-[11px] uppercase tracking-[0.1em] font-semibold text-neutral-700 dark:text-neutral-300 pb-2 border-b-2 border-neutral-800 dark:border-neutral-200 mb-6">
          Bài Viết
        </h2>
        <ErrorBoundary>
          <ArticleList articles={report.articles} />
        </ErrorBoundary>
      </section>
    </div>
  );
}
