import { useState, useEffect } from 'react';
import { fetchTodaysReports, fetchLatestReport, fetchRecentReports, type Report } from '../api/client';
import ReportCard from '../components/ReportCard';
import Synthesis from '../components/Synthesis';
import PriceChart from '../components/PriceChart';
import ErrorBoundary from '../components/ErrorBoundary';

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] uppercase tracking-[0.1em] font-semibold text-neutral-700 dark:text-neutral-300 pb-2 border-b-2 border-neutral-800 dark:border-neutral-200 mb-6">
      {children}
    </h2>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-neutral-200 dark:bg-neutral-800 rounded animate-skeleton ${className ?? ''}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      <section>
        <SkeletonBlock className="h-3 w-48 mb-6" />
        <div className="space-y-4">
          <SkeletonBlock className="h-5 w-3/4" />
          <SkeletonBlock className="h-4 w-full max-w-[65ch]" />
          <SkeletonBlock className="h-4 w-5/6 max-w-[65ch]" />
          <SkeletonBlock className="h-4 w-2/3 max-w-[65ch]" />
        </div>
      </section>
      <section>
        <SkeletonBlock className="h-3 w-36 mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2 py-5">
              <SkeletonBlock className="h-5 w-full" />
              <SkeletonBlock className="h-3 w-48" />
              <SkeletonBlock className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [previousReports, setPreviousReports] = useState<Report[]>([]);
  const [latest, setLatest] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [todaysReports, latestReport, recentReports] = await Promise.all([
          fetchTodaysReports(),
          fetchLatestReport(),
          fetchRecentReports(20),
        ]);
        setReports(todaysReports);
        setLatest(latestReport);

        const todayStr = new Date().toISOString().slice(0, 10);
        const older = recentReports.filter(
          (r) => r.generatedAt.slice(0, 10) !== todayStr
        );
        setPreviousReports(older);
      } catch (err) {
        console.error('Failed to load reports:', err);
        setError(err instanceof Error ? err.message : 'Lỗi khi tải báo cáo');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader>Giá Dầu Thô</SectionHeader>
        <ErrorBoundary>
          <PriceChart />
        </ErrorBoundary>
      </section>

      {latest?.synthesis && (
        <section>
          <SectionHeader>Phân Tích Thị Trường Mới Nhất</SectionHeader>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 -mt-4 mb-4">
            {new Date(latest.generatedAt).toLocaleString('vi-VN', {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </p>
          <div className="max-w-4xl">
            <ErrorBoundary>
              <Synthesis synthesis={latest.synthesis} />
            </ErrorBoundary>
          </div>
        </section>
      )}

      <section>
        <SectionHeader>Báo Cáo Hôm Nay</SectionHeader>
        {reports.length === 0 ? (
          <p className="text-neutral-700 dark:text-neutral-300">Chưa có báo cáo nào được tạo hôm nay.</p>
        ) : (
          <div className="grid gap-0 md:grid-cols-2 md:gap-x-8">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </section>

      {previousReports.length > 0 && (
        <section>
          <SectionHeader>Báo Cáo Trước Đó</SectionHeader>
          <div className="grid gap-0 md:grid-cols-2 md:gap-x-8">
            {previousReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
