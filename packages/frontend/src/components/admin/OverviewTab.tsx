import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchVisitStats, fetchVisitData, fetchUniqueIps } from '../../api/client';
import type { VisitStats, VisitData, UniqueIpsData } from '../../api/client';

export default function OverviewTab() {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [visitData, setVisitData] = useState<VisitData | null>(null);
  const [days, setDays] = useState(7);
  const [ipData, setIpData] = useState<UniqueIpsData | null>(null);
  const [ipDays, setIpDays] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchVisitStats(), fetchVisitData(days)])
      .then(([s, v]) => {
        setStats(s);
        setVisitData(v);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    fetchUniqueIps(ipDays).then(setIpData).catch(console.error);
  }, [ipDays]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 dark:border-neutral-200" />
      </div>
    );
  }

  const statCards = stats ? [
    { label: 'Hôm nay', value: stats.today },
    { label: '7 ngày', value: stats.week },
    { label: '30 ngày', value: stats.month },
    { label: 'IP duy nhất (hôm nay)', value: stats.uniqueIpsToday },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Daily visits chart */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Lượt truy cập theo ngày</h3>
          <div className="flex gap-1">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  days === d
                    ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {visitData && visitData.daily.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={visitData.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, background: '#1a1a1a', border: '1px solid #333', borderRadius: 4 }}
                labelStyle={{ color: '#999' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[2, 2, 0, 0]} name="Lượt xem" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-neutral-500 text-center py-8">Chưa có dữ liệu</p>
        )}
      </div>

      {/* Top pages */}
      {visitData && visitData.topPages.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded p-4">
          <h3 className="text-sm font-medium mb-3">Trang phổ biến</h3>
          <div className="space-y-2">
            {visitData.topPages.map((page) => (
              <div key={page.url} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700 dark:text-neutral-300 truncate mr-4">{page.url}</span>
                <span className="text-neutral-500 tabular-nums">{page.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unique IPs list */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">
            Danh sách IP {ipData ? <span className="text-neutral-500 font-normal">({ipData.total})</span> : null}
          </h3>
          <div className="flex gap-1">
            {[1, 7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setIpDays(d)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  ipDays === d
                    ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {ipData && ipData.ips.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                  <th className="pb-2 pr-4">IP</th>
                  <th className="pb-2 pr-4 text-right">Lượt xem</th>
                  <th className="pb-2 pr-4">Lần cuối</th>
                  <th className="pb-2">User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {ipData.ips.map((entry) => (
                  <tr key={entry.ip}>
                    <td className="py-2 pr-4 font-mono text-xs">{entry.ip}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{entry.count.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-neutral-500 whitespace-nowrap">
                      {new Date(entry.lastSeen).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2 text-neutral-500 truncate max-w-[200px]" title={entry.lastUserAgent || ''}>
                      {entry.lastUserAgent ? entry.lastUserAgent.slice(0, 60) + (entry.lastUserAgent.length > 60 ? '...' : '') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-neutral-500 text-center py-4">Chưa có dữ liệu</p>
        )}
      </div>
    </div>
  );
}
