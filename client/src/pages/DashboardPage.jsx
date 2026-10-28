import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Code2,
  RotateCcw,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag as TagIcon,
  Plus
} from 'lucide-react';
import { statsService, problemService } from '../services/api';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { PlatformBadge } from '../components/PlatformBadge';
import { formatDate, formatRelativeTime } from '../utils/helpers';
import { RevisitModal } from '../components/RevisitModal';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revisitModalProblem, setRevisitModalProblem] = useState(null);
  const [isRevisiting, setIsRevisiting] = useState(false);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await statsService.getDashboardStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics. Ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRecordRevisit = async ({ notes, variantReviewed }) => {
    if (!revisitModalProblem) return;
    try {
      setIsRevisiting(true);
      const res = await problemService.markAsRevisited(revisitModalProblem._id, {
        notes,
        variantReviewed
      });
      if (res.success) {
        setRevisitModalProblem(null);
        await fetchStats();
      }
    } catch (err) {
      console.error('Error recording revisit:', err);
      alert('Failed to record revision. Please try again.');
    } finally {
      setIsRevisiting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white rounded-xl border border-slate-200" />
          <div className="h-72 bg-white rounded-xl border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
        <p className="font-semibold">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    totalProblems = 0,
    totalRevisits = 0,
    dueForRevisionCount = 0,
    neverRevisitedCount = 0,
    byPlatform = [],
    byDifficulty = { Easy: 0, Medium: 0, Hard: 0, Unknown: 0 },
    byTopic = [],
    recentlyAdded = [],
    recentlyRevisited = [],
    revisionDueProblems = []
  } = stats || {};

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>DSA Mastery Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              GOAT Vault
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-xl">
              Track problem patterns, capture intuitive approaches and confusions, preserve clean implementations, and strengthen memory through deliberate revision cycles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/problems/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Problem</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Problems */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Solved
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalProblems}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Across all platforms</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Code2 className="w-6 h-6" />
          </div>
        </div>

        {/* Due For Revision */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Due For Revision
            </p>
            <h3 className="text-2xl font-bold text-amber-900 mt-1">{dueForRevisionCount}</h3>
            <Link
              to="/revision"
              className="text-xs text-amber-600 hover:text-amber-800 font-medium inline-flex items-center gap-1 mt-0.5"
            >
              <span>Review now</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Revisits */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Revision Cycles
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalRevisits}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Total sessions logged</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>

        {/* Never Revisited */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Never Revisited
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{neverRevisitedCount}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Single-solve problems</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics: Platforms, Difficulties, Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Difficulties Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Difficulty Distribution
            </h3>

            <div className="space-y-3">
              {[
                { label: 'Easy', count: byDifficulty.Easy || 0, color: 'bg-emerald-500', text: 'text-emerald-700' },
                { label: 'Medium', count: byDifficulty.Medium || 0, color: 'bg-amber-500', text: 'text-amber-700' },
                { label: 'Hard', count: byDifficulty.Hard || 0, color: 'bg-rose-500', text: 'text-rose-700' },
                ...(byDifficulty.Unknown > 0
                  ? [{ label: 'Unknown', count: byDifficulty.Unknown, color: 'bg-slate-400', text: 'text-slate-600' }]
                  : [])
              ].map((diff) => {
                const percentage = totalProblems > 0 ? Math.round((diff.count / totalProblems) * 100) : 0;
                return (
                  <div key={diff.label}>
                    <div className="flex items-center justify-between text-xs font-medium mb-1">
                      <span className={diff.text}>{diff.label}</span>
                      <span className="text-slate-500">
                        {diff.count} <span className="text-slate-400">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${diff.color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Standard DSA ratios</span>
            <span className="font-semibold text-slate-700">100% Calculated</span>
          </div>
        </div>

        {/* Platforms Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-blue-600" />
              Problems by Platform
            </h3>

            {byPlatform.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No platform data available yet.</p>
            ) : (
              <div className="space-y-2.5">
                {byPlatform.map((item) => (
                  <div
                    key={item.platform}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <span className="text-xs font-semibold text-slate-800">
                      {item.platform}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {item.count}
                      </span>
                      <span className="text-[11px] text-slate-400 w-10 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <Link
              to="/problems"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
            >
              <span>View all in problem list</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Top Topics */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <TagIcon className="w-4 h-4 text-purple-600" />
              Top Topics & Tags
            </h3>

            {byTopic.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No topics recorded yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {byTopic.map((item) => (
                  <Link
                    key={item.topic}
                    to={`/problems?topic=${encodeURIComponent(item.topic)}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-colors"
                  >
                    <span>{item.topic}</span>
                    <span className="text-[10px] font-semibold bg-white px-1.5 py-0.2 rounded-full border border-slate-200 text-slate-600">
                      {item.count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Click any topic to filter problems.
          </div>
        </div>
      </div>

      {/* Lists Grid: Due For Revision & Recently Added */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due For Revision Queue */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-slate-900">
                Problems Due for Revision
              </h3>
            </div>
            <Link
              to="/revision"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <span>Open queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {revisionDueProblems.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <RotateCcw className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-slate-700">All caught up!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No problems currently due for review based on your revision cadence.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {revisionDueProblems.map((prob) => (
                <div
                  key={prob._id}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        #{prob.problemNumber}
                      </span>
                      <Link
                        to={`/problems/${prob._id}`}
                        className="text-xs font-medium text-slate-800 hover:text-blue-600 truncate block"
                      >
                        {prob.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <PlatformBadge
                        platform={prob.platform}
                        customPlatformName={prob.customPlatformName}
                        size="xs"
                      />
                      <DifficultyBadge difficulty={prob.difficulty} size="xs" />
                      <span className="text-[11px] text-slate-400">
                        {prob.revisitCount === 0
                          ? `Solved ${formatRelativeTime(prob.firstSolvedAt)}`
                          : `Last reviewed ${formatRelativeTime(prob.lastRevisitedAt)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setRevisitModalProblem(prob)}
                      className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Revisit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Added Problems */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Recently Added Problems
            </h3>
            <Link
              to="/problems"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentlyAdded.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Code2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No problems added yet</p>
              <Link
                to="/problems/new"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                <Plus className="w-3 h-3" />
                <span>Add your first question</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentlyAdded.map((prob) => (
                <div
                  key={prob._id}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        #{prob.problemNumber}
                      </span>
                      <Link
                        to={`/problems/${prob._id}`}
                        className="text-xs font-medium text-slate-800 hover:text-blue-600 truncate block"
                      >
                        {prob.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <PlatformBadge
                        platform={prob.platform}
                        customPlatformName={prob.customPlatformName}
                        size="xs"
                      />
                      <DifficultyBadge difficulty={prob.difficulty} size="xs" />
                      <span className="text-[11px] text-slate-400">
                        Added {formatRelativeTime(prob.createdAt)}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/problems/${prob._id}`}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revisit Modal */}
      <RevisitModal
        isOpen={Boolean(revisitModalProblem)}
        problem={revisitModalProblem}
        isSubmitting={isRevisiting}
        onClose={() => setRevisitModalProblem(null)}
        onConfirm={handleRecordRevisit}
      />
    </div>
  );
};
