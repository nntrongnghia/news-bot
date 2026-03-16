import { useState, useEffect, useCallback } from 'react';
import { authClient } from '../lib/auth-client';

interface UserEntry {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  createdAt: Date;
}

export default function Admin() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const res = await authClient.admin.listUsers({
        query: { limit: 100 },
      });
      if (res.data) {
        setUsers(res.data.users as UserEntry[]);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function approveUser(userId: string) {
    await authClient.admin.unbanUser({ userId });
    await loadUsers();
  }

  async function banUser(userId: string) {
    await authClient.admin.banUser({ userId, banReason: 'Bị quản trị viên cấm' });
    await loadUsers();
  }

  async function setAdmin(userId: string) {
    await authClient.admin.setRole({ userId, role: 'admin' });
    await loadUsers();
  }

  const pendingUsers = users.filter((u) => u.banned && u.banReason === 'Pending admin approval');
  const activeUsers = users.filter((u) => !u.banned);
  const bannedUsers = users.filter((u) => u.banned && u.banReason !== 'Pending admin approval');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 dark:border-neutral-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-serif font-bold">Quản lý người dùng</h1>

      {pendingUsers.length > 0 && (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3">
            Chờ phê duyệt ({pendingUsers.length})
          </h2>
          <div className="space-y-2">
            {pendingUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded">
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-neutral-500">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveUser(user.id)}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Phê duyệt
                  </button>
                  <button
                    onClick={() => banUser(user.id)}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3">
          Người dùng hoạt động ({activeUsers.length})
        </h2>
        <div className="space-y-2">
          {activeUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded">
              <div>
                <p className="text-sm font-medium">
                  {user.name}
                  {user.role === 'admin' && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">admin</span>
                  )}
                </p>
                <p className="text-xs text-neutral-500">{user.email}</p>
              </div>
              <div className="flex gap-2">
                {user.role !== 'admin' && (
                  <>
                    <button
                      onClick={() => setAdmin(user.id)}
                      className="px-3 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Đặt quản trị
                    </button>
                    <button
                      onClick={() => banUser(user.id)}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Cấm
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {bannedUsers.length > 0 && (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3">
            Đã bị chặn ({bannedUsers.length})
          </h2>
          <div className="space-y-2">
            {bannedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded">
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-neutral-500">{user.email} — {user.banReason}</p>
                </div>
                <button
                  onClick={() => approveUser(user.id)}
                  className="px-3 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Bỏ cấm
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
