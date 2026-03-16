import { useState } from 'react';
import OverviewTab from '../components/admin/OverviewTab';
import UsersTab from '../components/admin/UsersTab';
import PipelineLogsTab from '../components/admin/PipelineLogsTab';

const tabs = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'users', label: 'Người dùng' },
  { key: 'pipeline', label: 'Pipeline' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-serif font-bold">Quản trị</h1>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-b-2 border-neutral-800 dark:border-neutral-200 text-neutral-800 dark:text-neutral-200 font-medium'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'pipeline' && <PipelineLogsTab />}
    </div>
  );
}
