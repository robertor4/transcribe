'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { UserActivity, TranscriptionStatus } from '@transcribe/shared';
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  Clock,
  Calendar,
  Activity,
  Sparkles,
  User as UserIcon,
  Shield,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export default function UserActivityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/activity`,
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
        throw new Error('Failed to fetch user activity');
      }

      const data = await response.json();
      setActivity(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && userId) {
      fetchActivity();
    }
  }, [user, userId]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: TranscriptionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <UserIcon className="w-4 h-4" />;
      case 'login':
        return <Activity className="w-4 h-4" />;
      case 'tier_change':
        return <TrendingUp className="w-4 h-4" />;
      case 'deletion':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'login':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'tier_change':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'deletion':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'created':
        return 'Account Created';
      case 'login':
        return 'Last Login';
      case 'tier_change':
        return 'Subscription Change';
      case 'deletion':
        return 'Account Deleted';
      default:
        return type;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-700 dark:text-gray-300">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#cc3399]" />
          <p className="text-gray-800 dark:text-gray-200">Loading activity...</p>
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
          <button
            onClick={() => router.push('/admin')}
            className="w-full bg-[#cc3399] text-white py-2 rounded-lg hover:bg-[#b82d89] transition-colors"
          >
            Back to Admin Panel
          </button>
        </div>
      </div>
    );
  }

  if (!activity) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-[#cc3399] dark:hover:text-[#cc3399] mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Admin Panel</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield className="w-8 h-8 text-[#cc3399]" />
              User Activity Audit
            </h1>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              Detailed activity history for {activity.user.displayName || activity.user.email}
            </p>
          </div>
          <button
            onClick={fetchActivity}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* User Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#cc3399] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {(activity.user.displayName || activity.user.email || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {activity.user.displayName || 'No Name'}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">{activity.user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    activity.user.subscriptionTier === 'free'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      : activity.user.subscriptionTier === 'professional'
                        ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  }`}
                >
                  {activity.user.subscriptionTier}
                </span>
                {activity.user.role === 'admin' && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                    Admin
                  </span>
                )}
                {activity.user.isDeleted && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                    Deleted
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              <FileText className="w-4 h-4" />
              Total Transcriptions
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {activity.summary.totalTranscriptions}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              <Clock className="w-4 h-4" />
              Hours Processed
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {activity.summary.totalHoursProcessed.toFixed(1)}h
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              <Sparkles className="w-4 h-4" />
              Analyses Generated
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {activity.summary.totalAnalysesGenerated}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              <Calendar className="w-4 h-4" />
              Account Age
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {activity.summary.accountAge}d
            </p>
          </div>
        </div>

        {/* Monthly Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Current Month Usage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Hours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activity.summary.monthlyUsage.hours.toFixed(1)}h
              </p>
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Transcriptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activity.summary.monthlyUsage.transcriptions}
              </p>
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Analyses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activity.summary.monthlyUsage.analyses}
              </p>
            </div>
          </div>
        </div>

        {/* Account Events Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Account Events
          </h3>
          <div className="space-y-4">
            {activity.accountEvents.map((event, index) => (
              <div key={index} className="flex items-start gap-4">
                <div
                  className={`p-2 rounded-lg ${getEventColor(event.type)} flex-shrink-0`}
                >
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {getEventLabel(event.type)}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    {formatDate(event.timestamp)}
                  </p>
                  {event.details && Object.keys(event.details).length > 0 && (
                    <div className="text-sm text-gray-700 dark:text-gray-400 mt-1">
                      {event.type === 'tier_change' && event.details.tier && (
                        <span>Tier: <span className="font-medium">{event.details.tier}</span>
                        {event.details.status && <> • Status: <span className="font-medium">{event.details.status}</span></>}</span>
                      )}
                      {event.type === 'created' && event.details.displayName && (
                        <span>Name: <span className="font-medium">{event.details.displayName}</span></span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transcriptions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Transcriptions (Last 50)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {activity.recentTranscriptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-700 dark:text-gray-400"
                    >
                      No transcriptions found
                    </td>
                  </tr>
                ) : (
                  activity.recentTranscriptions.map((transcription) => (
                    <tr key={transcription.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {transcription.title || transcription.fileName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            transcription.status
                          )}`}
                        >
                          {transcription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatDuration(transcription.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(transcription.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent On-Demand Analyses (Last 50)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Template Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Generated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {activity.recentAnalyses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-gray-700 dark:text-gray-400"
                    >
                      No analyses found
                    </td>
                  </tr>
                ) : (
                  activity.recentAnalyses.map((analysis) => (
                    <tr key={analysis.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {analysis.templateName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          {analysis.model}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(analysis.generatedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
