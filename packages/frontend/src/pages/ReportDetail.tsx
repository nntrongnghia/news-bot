import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchReport, type Report } from '../api/client';
import Synthesis from '../components/Synthesis';
import ArticleList from '../components/ArticleList';
import { format } from 'date-fns';

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchReport(parseInt(id, 10))
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 dark:text-gray-500">Đang tải báo cáo...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 dark:text-gray-500 mb-4">Không tìm thấy báo cáo.</p>
        <Link to="/" className="text-amber-400 hover:text-amber-300">
          Quay lại Bảng Điều Khiển
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
            &larr; Quay lại
          </Link>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-1">
            {report.reportKey}
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {format(new Date(report.generatedAt), 'MMMM d, yyyy h:mm a')} &middot;{' '}
            {report.articleCount ?? 0} bài viết
          </p>
        </div>
      </div>

      {report.synthesis && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Tổng Hợp Thị Trường
          </h2>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-100 dark:bg-gray-900/50">
            <Synthesis synthesis={report.synthesis} />
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Bài Viết</h2>
        <ArticleList articles={report.articles} />
      </section>
    </div>
  );
}
