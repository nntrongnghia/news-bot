import { useState, useEffect } from 'react';
import { fetchTodaysReports, fetchLatestReport, type Report } from '../api/client';
import ReportCard from '../components/ReportCard';
import Synthesis from '../components/Synthesis';

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [latest, setLatest] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [todaysReports, latestReport] = await Promise.all([
          fetchTodaysReports(),
          fetchLatestReport(),
        ]);
        setReports(todaysReports);
        setLatest(latestReport);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 dark:text-gray-500">Đang tải báo cáo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Latest synthesis */}
      {latest?.synthesis && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Tin Tức Thị Trường Mới Nhất
          </h2>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-100 dark:bg-gray-900/50">
            <Synthesis synthesis={latest.synthesis} />
          </div>
        </section>
      )}

      {/* Today's reports */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Báo Cáo Hôm Nay
        </h2>
        {reports.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500">Chưa có báo cáo nào được tạo hôm nay.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
