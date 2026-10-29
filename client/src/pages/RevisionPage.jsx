import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  Clock,
  Filter,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Search,
  X,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { problemService, tagService } from '../services/api';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { PlatformBadge } from '../components/PlatformBadge';
import {
  formatDate,
  formatRelativeTime,
  SUPPORTED_PLATFORMS,
  getFilledVariants
} from '../utils/helpers';
import { RevisitModal } from '../components/RevisitModal';

export const RevisionPage = () => {
  const [filterMode, setFilterMode] = useState('due-7'); // 'due-7', 'due-14', 'due-30', 'never', 'all'
  const [customDays, setCustomDays] = useState('7');
  const [platform, setPlatform] = useState('all');
  const [topic, setTopic] = useState('all');
  const [search, setSearch] = useState('');

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState([]);

  const [revisitModalProblem, setRevisitModalProblem] = useState(null);
  const [isRevisiting, setIsRevisiting] = useState(false);

  // Load tags for topic filter
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await tagService.getTags();
        if (res.success) {
          const combined = [...res.predefined, ...(res.customTags || [])];
          setAllTags(Array.from(new Set(combined)).sort());
        }
      } catch (err) {
        console.error('Failed to load tags:', err);
      }
    };
    fetchTags();
  }, []);

  // Fetch revision candidates
  const fetchRevisionCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        limit: 50,
        sortBy: 'leastRevisit' // oldest reviewed first
      };

      if (search.trim()) params.search = search.trim();
      if (platform !== 'all') params.platform = platform;
      if (topic !== 'all') params.topic = topic;

      if (filterMode === 'never') {
        params.neverRevisited = 'true';
      } else if (filterMode === 'due-7') {
        params.dueRevisionDays = '7';
      } else if (filterMode === 'due-14') {
        params.dueRevisionDays = '14';
      } else if (filterMode === 'due-30') {
        params.dueRevisionDays = '30';
      } else if (filterMode === 'custom' && customDays && !isNaN(Number(customDays))) {
        params.dueRevisionDays = customDays;
      }

      const res = await problemService.getProblems(params);
      if (res.success) {
        setProblems(res.problems || []);
      }
    } catch (err) {
      console.error('Failed to load revision queue:', err);
    } finally {
      setLoading(false);
    }
  }, [filterMode, customDays, platform, topic, search]);

  useEffect(() => {
    fetchRevisionCandidates();
  }, [fetchRevisionCandidates]);

  // Handle recording revision directly from list
  const handleRecordRevisit = async ({ notes, variantReviewed, solveStatus }) => {
    if (!revisitModalProblem) return;
    try {
      setIsRevisiting(true);
      const res = await problemService.markAsRevisited(revisitModalProblem._id, {
        notes,
        variantReviewed,
        solveStatus
      });
      if (res.success) {
        setRevisitModalProblem(null);
        await fetchRevisionCandidates();
      }
    } catch (err) {
      console.error('Error recording revision:', err);
      alert('Failed to record revision.');
    } finally {
      setIsRevisiting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-3">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Spaced Repetition & Revision Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Revision Queue
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-xl">
              Deliberately revisit problems you solved in the past. Strengthening memory pathways transforms temporary tricks into permanent intuition.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              {problems.length} candidates in queue
            </span>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        {/* Preset filter mode tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'due-7', label: 'Due (> 7 Days)' },
            { id: 'due-14', label: 'Due (> 14 Days)' },
            { id: 'due-30', label: 'Due (> 30 Days)' },
            { id: 'never', label: 'Never Revisited' },
            { id: 'all', label: 'All Problems' },
            { id: 'custom', label: 'Custom Days' }
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setFilterMode(mode.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterMode === mode.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {mode.label}
            </button>
          ))}

          {/* Custom days input if custom mode selected */}
          {filterMode === 'custom' && (
            <div className="inline-flex items-center gap-1.5 ml-2">
              <span className="text-xs text-slate-500">Older than:</span>
              <input
                type="number"
                min="1"
                max="365"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg text-slate-800"
              />
              <span className="text-xs text-slate-500">days</span>
            </div>
          )}
        </div>

        {/* Secondary Filters: Platform, Topic, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search queue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Platform */}
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">All Platforms</option>
            {SUPPORTED_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Topic */}
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">All Topics</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Revision Cards List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
      ) : problems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Your revision queue is clear!</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            No problems currently qualify for revision under these filter criteria. You're doing great!
          </p>
          <div className="mt-5">
            <button
              onClick={() => {
                setFilterMode('all');
                setPlatform('all');
                setTopic('all');
                setSearch('');
              }}
              className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Show all solved problems
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {problems.map((prob) => (
            <div
              key={prob._id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top header row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{prob.problemNumber}
                    </span>
                    <PlatformBadge
                      platform={prob.platform}
                      customPlatformName={prob.customPlatformName}
                      size="xs"
                    />
                  </div>
                  <DifficultyBadge difficulty={prob.difficulty} size="xs" />
                </div>

                {/* Title */}
                <Link
                  to={`/problems/${prob._id}`}
                  className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors block mb-2"
                >
                  {prob.title}
                </Link>

                {/* Topics */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {prob.topics?.map((top) => (
                    <span
                      key={top}
                      className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded"
                    >
                      {top}
                    </span>
                  ))}
                  {prob.customTags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-700 rounded border border-purple-100"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Typed Approaches Pills */}
                {(() => {
                  const filledVariants = getFilledVariants(prob.approaches);
                  if (filledVariants.length === 0) return null;
                  return (
                    <div className="flex flex-wrap items-center gap-1 mb-3">
                      {filledVariants.map((app) => (
                        <span
                          key={app.id || app.name}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-200"
                        >
                          <span>{app.name}</span>
                          {app.timeComplexity && (
                            <span className="font-mono text-[9px] text-blue-500">
                              {app.timeComplexity}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  );
                })()}

                {/* First Solve Status */}
                {prob.firstSolveStatus && (
                  <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/70 mb-3 text-xs text-blue-950 flex items-start gap-1.5">
                    <span className="font-bold text-blue-700 uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-blue-100 border border-blue-200 flex-shrink-0">
                      1st Solve
                    </span>
                    <span className="font-medium">{prob.firstSolveStatus}</span>
                  </div>
                )}

                {/* Confusion / Mistakes Preview if any */}
                {prob.confusionNotes ? (
                  <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/70 mb-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                      <HelpCircle className="w-3 h-3 text-amber-600" />
                      <span>Confusion Notes from Last Solve</span>
                    </div>
                    <p className="text-xs text-amber-900 line-clamp-3 leading-relaxed">
                      {prob.confusionNotes}
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 mb-3 text-[11px] text-slate-400 italic">
                    No confusion notes recorded.
                  </div>
                )}
              </div>

              {/* Bottom metadata and action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-slate-500 block">
                    {prob.revisitCount === 0 ? (
                      <span className="text-purple-600 font-semibold">
                        Never revisited • Solved {formatRelativeTime(prob.firstSolvedAt)}
                      </span>
                    ) : (
                      <span>
                        Last reviewed <strong className="text-slate-700">{formatRelativeTime(prob.lastRevisitedAt)}</strong> ({prob.revisitCount} times)
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/problems/${prob._id}`}
                    className="p-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    title="Open Details"
                  >
                    Open
                  </Link>

                  <button
                    type="button"
                    onClick={() => setRevisitModalProblem(prob)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Mark Revisited</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
