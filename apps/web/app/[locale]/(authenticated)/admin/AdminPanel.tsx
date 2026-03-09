'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '@transcribe/shared';
import { Trash2, UserX, Shield, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/Button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getApiUrl } from '@/lib/config';

// Tier badge config matching conversations table outline badge pattern
const tierConfig: Record<string, { dot: string; badge: string }> = {
  free: {
    dot: 'bg-gray-400',
    badge: 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
  },
  professional: {
    dot: 'bg-purple-500',
    badge: 'border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400',
  },
  enterprise: {
    dot: 'bg-blue-500',
    badge: 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
  },
};

const statusConfig: Record<string, { dot: string; badge: string; label: string }> = {
  active: {
    dot: 'bg-green-500',
    badge: 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    label: 'Active',
  },
  deleted: {
    dot: 'bg-red-500',
    badge: 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    label: 'Deleted',
  },
};

export function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ userId: string; hard: boolean } | null>(null);

  // Sort state
  type SortColumn = 'lastLogin' | 'created' | null;
  const [sortColumn, setSortColumn] = useState<SortColumn>('lastLogin');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedUsers = useMemo(() => {
    if (!sortColumn) return users;
    return [...users].sort((a, b) => {
      let dateA = 0;
      let dateB = 0;
      if (sortColumn === 'lastLogin') {
        dateA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
        dateB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
      } else if (sortColumn === 'created') {
        dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      }
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [users, sortColumn, sortDirection]);

  const formatLastLogin = (lastLogin?: Date) => {
    if (!lastLogin) {
      return <span className="text-gray-400 dark:text-gray-500 italic text-sm">Never</span>;
    }

    const date = new Date(lastLogin);
    if (isNaN(date.getTime())) {
      return <span className="text-gray-400 dark:text-gray-500 italic text-sm">Never</span>;
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let relativeTime = '';
    if (diffHours < 1) {
      relativeTime = 'Just now';
    } else if (diffHours < 24) {
      relativeTime = `${diffHours}h ago`;
    } else if (diffDays < 7) {
      relativeTime = `${diffDays}d ago`;
    } else {
      relativeTime = date.toLocaleDateString();
    }

    return (
      <span className="text-gray-500 dark:text-gray-400 text-sm" title={date.toLocaleString()}>
        {relativeTime}
      </span>
    );
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${getApiUrl()}/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin role required.');
        }
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  const handleDeleteUser = async (userId: string, hardDelete: boolean) => {
    try {
      setDeletingUserId(userId);

      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${getApiUrl()}/admin/users/${userId}?hardDelete=${hardDelete}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setConfirmDelete(null);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const SortableHeader = ({ column, children, className = '' }: { column: SortColumn; children: React.ReactNode; className?: string }) => (
    <TableHead className={className}>
      <button
        onClick={() => handleSort(column)}
        className="flex items-center gap-1 hover:text-[#8D6AFA] transition-colors"
      >
        {children}
        {sortColumn === column ? (
          sortDirection === 'desc' ? (
            <ArrowDown className="w-3.5 h-3.5 text-[#8D6AFA]" />
          ) : (
            <ArrowUp className="w-3.5 h-3.5 text-[#8D6AFA]" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>
    </TableHead>
  );

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center text-gray-700 dark:text-gray-300">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#8D6AFA]" />
          <p className="text-gray-800 dark:text-gray-200">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Error</h2>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button variant="brand" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-12 pt-4 sm:pt-4 lg:pt-[38px] pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="w-7 h-7 text-[#8D6AFA]" />
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage users and system settings</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchUsers}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Users</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{users.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Free Tier</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
            {users.filter((u) => u.subscriptionTier === 'free').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Professional</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
            {users.filter((u) => u.subscriptionTier === 'professional').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deleted</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
            {users.filter((u) => u.isDeleted).length}
          </p>
        </div>
      </div>

      {/* User Table */}
      <div className="border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800/60">
              <TableHead>User</TableHead>
              <TableHead className="w-[100px]">Tier</TableHead>
              <TableHead className="hidden md:table-cell w-[80px]">Role</TableHead>
              <SortableHeader column="created" className="hidden lg:table-cell w-[110px]">Created</SortableHeader>
              <SortableHeader column="lastLogin" className="w-[120px]">Last Login</SortableHeader>
              <TableHead className="hidden sm:table-cell w-[90px]">Status</TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((u) => {
              const tier = tierConfig[u.subscriptionTier] || tierConfig.free;
              const status = u.isDeleted ? statusConfig.deleted : statusConfig.active;

              return (
                <TableRow
                  key={u.uid}
                  className={`group cursor-pointer transition-colors ${u.isDeleted ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}
                  onClick={() => router.push(`/admin/users/${u.uid}`)}
                >
                  <TableCell className="py-2.5">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                        {u.displayName || 'No name'}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant="outline" className={`text-xs ${tier.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tier.dot} mr-1.5`} />
                      {u.subscriptionTier}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 hidden md:table-cell">
                    {u.role === UserRole.ADMIN ? (
                      <span className="text-[#8D6AFA] font-medium text-sm">Admin</span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">User</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-gray-500 dark:text-gray-400 text-sm hidden lg:table-cell">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-2.5">
                    {formatLastLogin(u.lastLogin)}
                  </TableCell>
                  <TableCell className="py-2.5 hidden sm:table-cell">
                    <Badge variant="outline" className={`text-xs ${status.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    {u.role !== UserRole.ADMIN && !u.isDeleted && (
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {confirmDelete?.userId === u.uid ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <span className="text-xs text-red-700 dark:text-red-300 whitespace-nowrap">
                              {confirmDelete.hard ? 'Permanent?' : 'Soft delete?'}
                            </span>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteUser(u.uid, confirmDelete.hard)}
                              disabled={deletingUserId === u.uid}
                            >
                              {deletingUserId === u.uid ? '...' : 'Yes'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDelete(null)}
                              disabled={deletingUserId === u.uid}
                            >
                              No
                            </Button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setConfirmDelete({ userId: u.uid, hard: false })}
                              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                              title="Soft delete (preserve data)"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ userId: u.uid, hard: true })}
                              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                              title="Hard delete (permanent)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
