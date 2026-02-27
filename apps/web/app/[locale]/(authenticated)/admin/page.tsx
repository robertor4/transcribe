'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '@transcribe/shared';
import { Trash2, UserX, Shield, RefreshCw, ArrowLeft } from 'lucide-react';
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

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Format last login with relative time
  const formatLastLogin = (lastLogin?: Date) => {
    if (!lastLogin) {
      return <span className="text-gray-500 dark:text-gray-500 italic">Never</span>;
    }

    const date = new Date(lastLogin);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return <span className="text-gray-500 dark:text-gray-500 italic">Never</span>;
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
      <span className="text-gray-700 dark:text-gray-300" title={date.toLocaleString()}>
        {relativeTime}
      </span>
    );
  };

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users`,
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
    const confirmMessage = hardDelete
      ? 'Are you sure you want to PERMANENTLY delete this user? This action cannot be undone and will delete all their data.'
      : 'Are you sure you want to soft-delete this user? Their data will be preserved and can be recovered.';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingUserId(userId);

      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}?hardDelete=${hardDelete}`,
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

      const result = await response.json();
      alert(result.data.message);

      // Refresh user list
      await fetchUsers();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to delete user'}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-700 dark:text-gray-300">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#8D6AFA]" />
          <p className="text-gray-800 dark:text-gray-200">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Error</h2>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button
            variant="brand"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield className="w-8 h-8 text-[#8D6AFA]" />
              Admin Panel
            </h1>
            <p className="mt-2 text-gray-700 dark:text-gray-300">Manage users and system settings</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/dashboard')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchUsers}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{users.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Free Tier</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {users.filter((u) => u.subscriptionTier === 'free').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Professional</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {users.filter((u) => u.subscriptionTier === 'professional').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Deleted</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {users.filter((u) => u.isDeleted).length}
            </p>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-100 dark:bg-gray-700">
              <TableRow>
                <TableHead className="px-6 text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">User</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Tier</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Role</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Created</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Last Login</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Status</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.uid}
                  className={`${u.isDeleted ? 'bg-red-50 dark:bg-red-900/20' : ''} cursor-pointer`}
                  onClick={() => router.push(`/admin/users/${u.uid}`)}
                >
                  <TableCell className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {u.displayName || 'No name'}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-400">{u.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge className={`${
                      u.subscriptionTier === 'free'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        : u.subscriptionTier === 'professional'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-pink-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    }`}>
                      {u.subscriptionTier}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {u.role === UserRole.ADMIN ? (
                      <span className="text-[#8D6AFA] font-medium">Admin</span>
                    ) : (
                      'User'
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    {formatLastLogin(u.lastLogin)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {u.isDeleted ? (
                      <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                        Deleted
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {u.role !== UserRole.ADMIN && !u.isDeleted && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(u.uid, false);
                            }}
                            disabled={deletingUserId === u.uid}
                            className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                            title="Soft delete (preserve data)"
                          >
                            <UserX className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(u.uid, true);
                            }}
                            disabled={deletingUserId === u.uid}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Hard delete (permanent)"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
