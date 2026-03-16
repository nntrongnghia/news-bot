import { useState, useEffect } from 'react';
import { fetchPipelineLogs } from '../../api/client';
import type { PipelineLogEntry } from '../../api/client';

const statusColors: Record<string, string> = {
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  skipped: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function formatDuration(start: string, end: string | null): string {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function PipelineLogsTab() {
  const [logs, setLogs] = useState<PipelineLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedError, setExpandedError] = useState<number | null>(null);

  useEffect(() => {
    fetchPipelineLogs(50)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 dark:border-neutral-200" />
      </div>
    );
  }

  if (logs.length === 0) {
    return <p className="text-sm text-neutral-500 text-center py-8">Chưa có log nào</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800 text-left">
            <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-neutral-500">Thời gian</th>
            <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-neutral-500">Trigger</th>
            <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-neutral-500">Trạng thái</th>
            <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-neutral-500">Bài viết</th>
            <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-neutral-500">Thời lượng</th>
            <th className="py-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Lỗi</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
              <td className="py-2 pr-4 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                {formatTime(log.startedAt)}
              </td>
              <td className="py-2 pr-4">
                <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {log.trigger}
                </span>
              </td>
              <td className="py-2 pr-4">
                <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[log.status] || ''}`}>
                  {log.status}
                </span>
              </td>
              <td className="py-2 pr-4 tabular-nums">{log.articleCount ?? '—'}</td>
              <td className="py-2 pr-4 tabular-nums whitespace-nowrap">
                {formatDuration(log.startedAt, log.finishedAt)}
              </td>
              <td className="py-2">
                {log.error ? (
                  <button
                    onClick={() => setExpandedError(expandedError === log.id ? null : log.id)}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    {expandedError === log.id ? log.error : 'Xem lỗi'}
                  </button>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
