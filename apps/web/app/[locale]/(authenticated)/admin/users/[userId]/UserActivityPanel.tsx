'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { UserActivity } from '@transcribe/shared';
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  Clock,
  Calendar,
  Activity,
  User as UserIcon,
  Shield,
  TrendingUp,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { AiIcon } from '@/components/icons/AiIcon';
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

// Status badge config matching conversations table pattern
const transcriptionStatusConfig: Record<string, { dot: string; badge: string }> = {
  completed: {
    dot: 'bg-green-500',
    badge: 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
  },
  processing: {
    dot: 'bg-yellow-500 animate-pulse',
    badge: 'border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
  },
  failed: {
    dot: 'bg-red-500',
    badge: 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
  },
  pending: {
    dot: 'bg-gray-400',
    badge: 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400',
  },
};

const tierConfig: Record<string, { dot: string; badge: string }> = {
  free: { dot: 'bg-gray-400', badge: 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400' },
  professional: { dot: 'bg-purple-500', badge: 'border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400' },
  enterprise: { dot: 'bg-blue-500', badge: 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' },
};

const eventConfig: Record<string, { icon: typeof UserIcon; dot: string; badge: string; label: string }> = {
  created: { icon: UserIcon, dot: 'bg-blue-500', badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400', label: 'Account Created' },
  login: { icon: Activity, dot: 'bg-green-500', badge: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400', label: 'Last Login' },
  tier_change: { icon: TrendingUp, dot: 'bg-purple-500', badge: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400', label: 'Subscription Change' },
  deletion: { icon: AlertCircle, dot: 'bg-red-500', badge: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400', label: 'Account Deleted' },
};

const defaultEventConfig = { icon: Calendar, dot: 'bg-gray-400', badge: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400', label: 'Event' };

export function UserActivityPanel() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resettingUsage, setResettingUsage] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${getApiUrl()}/admin/users/${userId}/activity`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin role required.');
        }
        throw new Error('Failed to fetch user activity');
      }

      const data = await response.json();
      setActivity(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity');
    } finally {
      setLoading(false);
    }
  }, [user, userId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && userId) {
      fetchActivity();
    }
  }, [user, userId, fetchActivity]);

  const handleResetUsage = async () => {
    if (!activity) return;
    try {
      setResettingUsage(true);
      const token = await user?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${getApiUrl()}/admin/users/${userId}/reset-usage`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to reset usage');

      setShowResetConfirm(false);
      await fetchActivity();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset usage');
    } finally {
      setResettingUsage(false);
    }
  };

  const formatDate = (date: Date | string) => new Date(date).toLocaleString();

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center text-gray-700 dark:text-gray-300">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#8D6AFA]" />
          <p className="text-gray-800 dark:text-gray-200">Loading activity...</p>
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
          <Button variant="brand" onClick={() => router.push('/admin')}>
            Back to Admin Panel
          </Button>
        </div>
      </div>
    );
  }

  if (!activity) return null;

  const tier = tierConfig[activity.user.subscriptionTier] || tierConfig.free;

  const locale = (params?.locale as string) || 'en';

  return (
    <div className="px-4 sm:px-6 lg:px-12 pt-4 sm:pt-4 lg:pt-[38px] pb-12">
      {/* Breadcrumb + Refresh */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/${locale}/admin`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#8D6AFA] dark:hover:text-[#8D6AFA] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin Panel
        </Link>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchActivity}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* User Profile + Stats Row */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* User Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700/50 p-4 lg:w-[320px] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#8D6AFA] rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {(activity.user.displayName || activity.user.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {activity.user.displayName || 'No Name'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{activity.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant="outline" className={`text-xs ${tier.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${tier.dot} mr-1.5`} />
              {activity.user.subscriptionTier}
            </Badge>
            {activity.user.role === 'admin' && (
              <Badge variant="outline" className="text-xs border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
            {activity.user.isDeleted && (
              <Badge variant="outline" className="text-xs border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                Deleted
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              Transcriptions
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {activity.summary.totalTranscriptions}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              Hours
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5 tabular-nums">
              {activity.summary.totalHoursProcessed.toFixed(1)}h
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <AiIcon size={14} />
              Analyses
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {activity.summary.totalAnalysesGenerated}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              Account Age
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5 tabular-nums">
              {activity.summary.accountAge}d
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Usage + Account Events row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Monthly Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Current Month Usage
            </h3>
            {showResetConfirm ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <span className="text-xs text-orange-700 dark:text-orange-300">Reset?</span>
                <Button variant="danger" size="sm" onClick={handleResetUsage} disabled={resettingUsage}>
                  {resettingUsage ? '...' : 'Yes'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)} disabled={resettingUsage}>
                  No
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hours</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {activity.summary.monthlyUsage.hours.toFixed(1)}h
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transcriptions</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {activity.summary.monthlyUsage.transcriptions}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Analyses</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {activity.summary.monthlyUsage.analyses}
              </p>
            </div>
          </div>
        </div>

        {/* Account Events */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700/50 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">
            Account Events
          </h3>
          <div className="space-y-3">
            {activity.accountEvents.map((event, index) => {
              const config = eventConfig[event.type] || defaultEventConfig;
              const Icon = config.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-md ${config.badge} flex-shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {config.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(event.timestamp)}
                    </p>
                    {event.details && Object.keys(event.details).length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {event.type === 'tier_change' && event.details.tier && (
                          <>Tier: <span className="font-medium">{event.details.tier}</span>
                          {event.details.status && <> &bull; Status: <span className="font-medium">{event.details.status}</span></>}</>
                        )}
                        {event.type === 'created' && event.details.displayName && (
                          <>Name: <span className="font-medium">{event.details.displayName}</span></>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transcriptions */}
      <div className="border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700/50">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Recent Transcriptions <span className="text-gray-400 dark:text-gray-500 font-normal">(Last 50)</span>
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800/60">
              <TableHead>File Name</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="hidden sm:table-cell w-[90px]">Duration</TableHead>
              <TableHead className="hidden sm:table-cell w-[160px]">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.recentTranscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No transcriptions found
                </TableCell>
              </TableRow>
            ) : (
              activity.recentTranscriptions.map((transcription) => {
                const statusCfg = transcriptionStatusConfig[transcription.status] || transcriptionStatusConfig.pending;
                return (
                  <TableRow key={transcription.id} className="group">
                    <TableCell className="py-2.5">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                        {transcription.title || transcription.fileName}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className={`text-xs ${statusCfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} mr-1.5`} />
                        {transcription.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-sm text-gray-500 dark:text-gray-400 tabular-nums hidden sm:table-cell">
                      {formatDuration(transcription.duration)}
                    </TableCell>
                    <TableCell className="py-2.5 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                      {formatDate(transcription.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Recent Analyses */}
      <div className="border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700/50">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Recent Analyses <span className="text-gray-400 dark:text-gray-500 font-normal">(Last 50)</span>
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800/60">
              <TableHead>Template Name</TableHead>
              <TableHead className="w-[100px]">Model</TableHead>
              <TableHead className="hidden sm:table-cell w-[160px]">Generated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.recentAnalyses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No analyses found
                </TableCell>
              </TableRow>
            ) : (
              activity.recentAnalyses.map((analysis) => (
                <TableRow key={analysis.id} className="group">
                  <TableCell className="py-2.5">
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {analysis.templateName}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant="outline" className="text-xs border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                      {analysis.model}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {formatDate(analysis.generatedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
