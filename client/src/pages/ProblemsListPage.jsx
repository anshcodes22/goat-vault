import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  Edit,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus,
  BookOpen,
  Calendar,
  Layers,
  LayoutGrid,
  List as ListIcon,
  HelpCircle,
  Tag as TagIcon
} from 'lucide-react';
import { problemService, tagService } from '../services/api';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { PlatformBadge } from '../components/PlatformBadge';
import {
  formatDate,
  formatRelativeTime,
  SUPPORTED_PLATFORMS,
  SUPPORTED_LANGUAGES,
  isVariantFilled,
  getFilledVariants
} from '../utils/helpers';
import { RevisitModal } from '../components/RevisitModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const ProblemsListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter states initialized from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [platform, setPlatform] = useState(searchParams.get('platform') || 'all');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || 'all');
  const [topic, setTopic] = useState(searchParams.get('topic') || 'all');
  const [language, setLanguage] = useState(searchParams.get('language') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'recent');
  const [neverRevisited, setNeverRevisited] = useState(
    searchParams.get('neverRevisited') === 'true'
  );
  const [hasConfusion, setHasConfusion] = useState(
    searchParams.get('hasConfusion') === 'true'
  );
  const [dueRevisionDays, setDueRevisionDays] = useState(
    searchParams.get('dueRevisionDays') || ''
  );
  const [variantFilter, setVariantFilter] = useState(
    searchParams.get('variant') || ''
  );
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Data states
  const [problems, setProblems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState([]);

  // Modals state
  const [revisitModalProblem, setRevisitModalProblem] = useState(null);
  const [deleteModalProblem, setDeleteModalProblem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRevisiting, setIsRevisiting] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Load available tags for filter dropdown
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await tagService.getTags();
        if (res.success) {
          const combined = [
            ...res.predefined,
            ...(res.customTags || [])
          ];
          setAllTags(Array.from(new Set(combined)).sort());
        }
      } catch (err) {
        console.error('Failed to load filter tags:', err);
      }
    };
    fetchTags();
  }, []);

  // Fetch problems with current query filters
  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: search.trim() || undefined,
        platform: platform !== 'all' ? platform : undefined,
        difficulty: difficulty !== 'all' ? difficulty : undefined,
        topic: topic !== 'all' ? topic : undefined,
        language: language !== 'all' ? language : undefined,
        neverRevisited: neverRevisited ? 'true' : undefined,
        hasConfusion: hasConfusion ? 'true' : undefined,
        dueRevisionDays: dueRevisionDays || undefined,
        variant: variantFilter.trim() || undefined,
        sortBy,
        page,
        limit: 12
      };

      const res = await problemService.getProblems(params);
      if (res.success) {
        setProblems(res.problems || []);
        setPagination(res.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching problems:', err);
    } finally {
      setLoading(false);
    }
  }, [search, platform, difficulty, topic, language, sortBy, neverRevisited, hasConfusion, dueRevisionDays, variantFilter, page]);

  // Sync to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (platform !== 'all') params.set('platform', platform);
    if (difficulty !== 'all') params.set('difficulty', difficulty);
    if (topic !== 'all') params.set('topic', topic);
    if (language !== 'all') params.set('language', language);
    if (sortBy !== 'recent') params.set('sortBy', sortBy);
    if (neverRevisited) params.set('neverRevisited', 'true');
    if (hasConfusion) params.set('hasConfusion', 'true');
    if (dueRevisionDays) params.set('dueRevisionDays', dueRevisionDays);
    if (variantFilter.trim()) params.set('variant', variantFilter.trim());
    if (page > 1) params.set('page', page.toString());

    setSearchParams(params, { replace: true });
    fetchProblems();
  }, [fetchProblems, search, platform, difficulty, topic, language, sortBy, neverRevisited, hasConfusion, dueRevisionDays, variantFilter, page, setSearchParams]);

  const handleClearFilters = () => {
    setSearch('');
    setPlatform('all');
    setDifficulty('all');
    setTopic('all');
    setLanguage('all');
    setSortBy('recent');
    setNeverRevisited(false);
    setHasConfusion(false);
    setDueRevisionDays('');
    setVariantFilter('');
    setPage(1);
  };

  const activeFiltersCount = [
    platform !== 'all',
    difficulty !== 'all',
    topic !== 'all',
    language !== 'all',
    neverRevisited,
    hasConfusion,
    dueRevisionDays !== '',
    variantFilter.trim() !== ''
  ].filter(Boolean).length;

  // Handle revisit action
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
        await fetchProblems();
      }
    } catch (err) {
      console.error('Error recording revisit:', err);
      alert('Failed to record revision.');
    } finally {
      setIsRevisiting(false);
    }
  };

  // Handle delete action
  const handleDeleteConfirm = async () => {
    if (!deleteModalProblem) return;
    try {
      setIsDeleting(true);
      const res = await problemService.deleteProblem(deleteModalProblem._id);
      if (res.success) {
        setDeleteModalProblem(null);
        await fetchProblems();
      }
    } catch (err) {
      console.error('Error deleting problem:', err);
      alert('Failed to delete problem.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Problems Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage, search, filter and track revisions across all your solved DSA questions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/problems/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Problem</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search problem name, question number (e.g. 1, 123A), topics..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Selects */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:flex items-center">
            {/* Platform filter */}
            <select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Platforms</option>
              {SUPPORTED_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Difficulty filter */}
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Unknown">Unknown</option>
            </select>

            {/* Topic filter */}
            <select
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-blue-500 max-w-[140px] truncate"
            >
              <option value="all">All Topics</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="recent">Recently Added</option>
              <option value="oldest">Oldest Added</option>
              <option value="alpha">Alphabetical (A-Z)</option>
              <option value="firstSolved">First Solved Date</option>
              <option value="recentRevisit">Recently Revisited</option>
              <option value="leastRevisit">Least Recently Revisited</option>
              <option value="revisitCount">Most Revisited</option>
            </select>
          </div>

          {/* Toggle Advanced Filters Button & View mode */}
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                showAdvancedFilters || activeFiltersCount > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-slate-600 transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-blue-600' : 'hover:text-slate-900'
                }`}
                title="Table View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-slate-600 transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'hover:text-slate-900'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Filters Row */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-fadeIn">
            {/* Language filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="all">All Languages</option>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due for revision days */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Due for Revision
              </label>
              <select
                value={dueRevisionDays}
                onChange={(e) => {
                  setDueRevisionDays(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="">Any Revisit Status</option>
                <option value="7">Not revisited in &gt; 7 days</option>
                <option value="14">Not revisited in &gt; 14 days</option>
                <option value="30">Not revisited in &gt; 30 days</option>
              </select>
            </div>

            {/* Approach variant filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Solution Variant
              </label>
              <input
                type="text"
                placeholder="e.g. Optimal, Brute Force"
                value={variantFilter}
                onChange={(e) => {
                  setVariantFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
              />
            </div>

            {/* Toggle checkboxes */}
            <div className="flex flex-col justify-end space-y-1.5 pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={neverRevisited}
                  onChange={(e) => {
                    setNeverRevisited(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Never revisited (0 revisits)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasConfusion}
                  onChange={(e) => {
                    setHasConfusion(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Has confusion notes</span>
              </label>
            </div>
          </div>
        )}

        {/* Clear Filters bar if any active */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing filtered results (<strong className="text-slate-800">{pagination.total}</strong> problems found)
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Clear all filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-4 animate-pulse">
          <div className="h-8 bg-slate-100 rounded-md w-1/4" />
          <div className="h-12 bg-slate-100 rounded-md" />
          <div className="h-12 bg-slate-100 rounded-md" />
          <div className="h-12 bg-slate-100 rounded-md" />
        </div>
      ) : problems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No problems found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {activeFiltersCount > 0
              ? 'No problems match the current filter criteria. Try adjusting or clearing your filters.'
              : 'Your vault is empty! Add your first problem to start organizing approaches and revision schedules.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {activeFiltersCount > 0 ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/problems/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Problem</span>
              </Link>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">#</th>
                  <th className="py-3 px-4">Problem Name</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Topics & Tags</th>
                  <th className="py-3 px-4">Approaches</th>
                  <th className="py-3 px-4">Last Revisit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {problems.map((prob) => (
                  <tr
                    key={prob._id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-500">
                      {prob.problemNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/problems/${prob._id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors max-w-xs truncate"
                        >
                          {prob.title}
                        </Link>
                        {prob.confusionNotes && (
                          <span
                            title="Contains confusion notes"
                            className="inline-flex p-0.5 rounded text-amber-500 bg-amber-50"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <PlatformBadge
                        platform={prob.platform}
                        customPlatformName={prob.customPlatformName}
                        size="xs"
                      />
                    </td>

                    <td className="py-3.5 px-4">
                      <DifficultyBadge difficulty={prob.difficulty} size="xs" />
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {prob.topics?.slice(0, 2).map((top) => (
                          <span
                            key={top}
                            className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded"
                          >
                            {top}
                          </span>
                        ))}
                        {prob.customTags?.slice(0, 1).map((tag) => (
                          <span
                            key={tag}
                            className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-700 rounded border border-purple-100"
                          >
                            #{tag}
                          </span>
                        ))}
                        {(prob.topics?.length || 0) + (prob.customTags?.length || 0) > 3 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            +{(prob.topics?.length || 0) + (prob.customTags?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {(() => {
                        const filledVariants = getFilledVariants(prob.approaches);
                        if (filledVariants.length === 0) {
                          return <span className="text-[11px] text-slate-400 italic">No variants typed</span>;
                        }
                        return (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {filledVariants.map((app) => (
                              <span
                                key={app.id || app.name}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-200"
                              >
                                <span>{app.name}</span>
                                {app.timeComplexity && (
                                  <span className="font-mono text-[9px] text-blue-500 bg-blue-100/60 px-1 py-0.2 rounded">
                                    {app.timeComplexity}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <span className="text-slate-800 font-medium block">
                          {formatRelativeTime(prob.lastRevisitedAt)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {prob.revisitCount || 0} revisits
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRevisitModalProblem(prob)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Mark as revisited"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/problems/${prob._id}/edit`}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit problem"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteModalProblem(prob)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete problem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((prob) => (
            <div
              key={prob._id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
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

                <Link
                  to={`/problems/${prob._id}`}
                  className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 block mb-2"
                >
                  {prob.title}
                </Link>

                {/* Topics Pills */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {prob.topics?.slice(0, 3).map((top) => (
                    <span
                      key={top}
                      className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-100"
                    >
                      {top}
                    </span>
                  ))}
                  {prob.customTags?.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-700 rounded-md border border-purple-100"
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

                {/* Confusion Snippet */}
                {prob.confusionNotes && (
                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 mb-3 text-[11px] text-amber-900 line-clamp-2 italic">
                    {prob.confusionNotes}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  <span className="block font-medium text-slate-700">
                    {formatRelativeTime(prob.lastRevisitedAt)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {prob.revisitCount || 0} revs • {getFilledVariants(prob.approaches).length} variant{getFilledVariants(prob.approaches).length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRevisitModalProblem(prob)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Mark revisited"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/problems/${prob._id}/edit`}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xs">
          <div className="text-xs text-slate-500">
            Page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
            <strong className="text-slate-800">{pagination.totalPages}</strong> (
            {pagination.total} total problems)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteModalProblem)}
        title={`Delete "${deleteModalProblem?.title}"?`}
        message={`Are you sure you want to delete problem #${deleteModalProblem?.problemNumber} (${deleteModalProblem?.title}) from your vault? All approaches, code snippets, and revision history will be permanently deleted.`}
        confirmText="Delete Problem"
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModalProblem(null)}
      />
    </div>
  );
};
