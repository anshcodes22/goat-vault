import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  Edit,
  Trash2,
  RotateCcw,
  Calendar,
  Clock,
  CheckCircle2,
  HelpCircle,
  Code2,
  FileText,
  AlertCircle,
  Tag as TagIcon,
  ChevronRight,
  Save,
  Check
} from 'lucide-react';
import { problemService } from '../services/api';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { PlatformBadge } from '../components/PlatformBadge';
import { CodeEditor } from '../components/CodeEditor';
import { SynchronizedVariantTabs } from '../components/SynchronizedVariantTabs';
import { RevisitModal } from '../components/RevisitModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { formatDate, formatRelativeTime, isVariantFilled, getFilledVariants } from '../utils/helpers';

export const ProblemDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronized active variant ID (strictly shared between Approach & Code!)
  const [activeVariantId, setActiveVariantId] = useState('');

  // Editable state for the currently active variant
  const [currentExplanation, setCurrentExplanation] = useState('');
  const [currentCode, setCurrentCode] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('C++');
  const [currentTimeComplexity, setCurrentTimeComplexity] = useState('');
  const [currentSpaceComplexity, setCurrentSpaceComplexity] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');
  const [hasUnsavedVariantChanges, setHasUnsavedVariantChanges] = useState(false);
  const [isSavingVariant, setIsSavingVariant] = useState(false);

  // Editable confusion notes state
  const [isEditingConfusion, setIsEditingConfusion] = useState(false);
  const [confusionText, setConfusionText] = useState('');
  const [isSavingConfusion, setIsSavingConfusion] = useState(false);

  // Modals state
  const [isRevisitModalOpen, setIsRevisitModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmittingRevisit, setIsSubmittingRevisit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProblem = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await problemService.getProblemById(id);
      if (res.success && res.problem) {
        setProblem(res.problem);
        setConfusionText(res.problem.confusionNotes || '');

        // Select the first variant with content, or preserve active if it exists
        const approaches = res.problem.approaches || [];
        const existing = approaches.find((a) => a.id === activeVariantId);
        const firstFilled = approaches.find(isVariantFilled);
        const target = existing || firstFilled || approaches[0];

        if (target) {
          setActiveVariantId(target.id);
          setCurrentExplanation(target.explanation || '');
          setCurrentCode(target.code || '');
          setCurrentLanguage(target.language || res.problem.language || 'C++');
          setCurrentTimeComplexity(target.timeComplexity || '');
          setCurrentSpaceComplexity(target.spaceComplexity || '');
          setCurrentNotes(target.notes || '');
          setHasUnsavedVariantChanges(false);
        }
      } else {
        setError('Problem not found');
      }
    } catch (err) {
      console.error('Error fetching problem details:', err);
      setError(err.response?.data?.message || 'Failed to load problem.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  // When switching the synchronized tab
  const handleSelectVariant = (variantId) => {
    if (!problem || !problem.approaches) return;
    // If unsaved changes exist in current variant, auto-save or prompt
    if (hasUnsavedVariantChanges) {
      handleSaveActiveVariant();
    }

    const selected = problem.approaches.find((a) => a.id === variantId);
    if (selected) {
      setActiveVariantId(selected.id);
      setCurrentExplanation(selected.explanation || '');
      setCurrentCode(selected.code || '');
      setCurrentLanguage(selected.language || problem.language || 'C++');
      setCurrentTimeComplexity(selected.timeComplexity || '');
      setCurrentSpaceComplexity(selected.spaceComplexity || '');
      setCurrentNotes(selected.notes || '');
      setHasUnsavedVariantChanges(false);
    }
  };

  // Add a new approach variant
  const handleAddVariant = async (name) => {
    try {
      const res = await problemService.addApproachVariant(problem._id, {
        name,
        language: problem.language || 'C++'
      });
      if (res.success && res.approach) {
        setProblem((prev) => ({
          ...prev,
          approaches: res.approaches
        }));
        // Select the newly created variant
        handleSelectVariant(res.approach.id);
      }
    } catch (err) {
      console.error('Failed to add approach variant:', err);
      alert(err.response?.data?.message || 'Failed to add approach.');
    }
  };

  // Rename approach variant
  const handleRenameVariant = async (variantId, newName) => {
    try {
      const res = await problemService.renameApproachVariant(problem._id, variantId, newName);
      if (res.success) {
        setProblem((prev) => ({
          ...prev,
          approaches: res.approaches
        }));
      }
    } catch (err) {
      console.error('Failed to rename variant:', err);
      alert(err.response?.data?.message || 'Failed to rename approach.');
    }
  };

  // Delete approach variant
  const handleDeleteVariant = async (variantId) => {
    try {
      const res = await problemService.deleteApproachVariant(problem._id, variantId);
      if (res.success) {
        setProblem((prev) => ({
          ...prev,
          approaches: res.approaches
        }));
        // If the deleted variant was currently active, switch to first remaining
        if (activeVariantId === variantId) {
          const nextVariant = res.approaches[0];
          if (nextVariant) {
            handleSelectVariant(nextVariant.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete approach variant:', err);
      alert(err.response?.data?.message || 'Failed to delete approach.');
    }
  };

  // Save active variant changes to MongoDB
  const handleSaveActiveVariant = async () => {
    if (!problem || !activeVariantId) return;
    try {
      setIsSavingVariant(true);
      const res = await problemService.updateApproachVariant(problem._id, activeVariantId, {
        explanation: currentExplanation,
        code: currentCode,
        language: currentLanguage,
        timeComplexity: currentTimeComplexity,
        spaceComplexity: currentSpaceComplexity,
        notes: currentNotes
      });
      if (res.success) {
        setProblem((prev) => ({
          ...prev,
          approaches: res.approaches
        }));
        setHasUnsavedVariantChanges(false);
      }
    } catch (err) {
      console.error('Error saving approach variant:', err);
      alert('Failed to save approach changes.');
    } finally {
      setIsSavingVariant(false);
    }
  };

  // Save confusion notes in place
  const handleSaveConfusion = async () => {
    try {
      setIsSavingConfusion(true);
      const res = await problemService.updateProblem(problem._id, {
        confusionNotes: confusionText
      });
      if (res.success) {
        setProblem((prev) => ({
          ...prev,
          confusionNotes: confusionText
        }));
        setIsEditingConfusion(false);
      }
    } catch (err) {
      console.error('Error saving confusion notes:', err);
      alert('Failed to save confusion notes.');
    } finally {
      setIsSavingConfusion(false);
    }
  };

  // Record a revisit event
  const handleRecordRevisit = async ({ notes, variantReviewed }) => {
    try {
      setIsSubmittingRevisit(true);
      const res = await problemService.markAsRevisited(problem._id, {
        notes,
        variantReviewed
      });
      if (res.success && res.problem) {
        setProblem(res.problem);
        setIsRevisitModalOpen(false);
      }
    } catch (err) {
      console.error('Error recording revisit:', err);
      alert('Failed to record revision.');
    } finally {
      setIsSubmittingRevisit(false);
    }
  };

  // Delete problem entirely
  const handleDeleteProblem = async () => {
    try {
      setIsDeleting(true);
      const res = await problemService.deleteProblem(problem._id);
      if (res.success) {
        navigate('/problems');
      }
    } catch (err) {
      console.error('Error deleting problem:', err);
      alert('Failed to delete problem.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-white rounded-xl border border-slate-200" />
          <div className="h-96 bg-white rounded-xl border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center text-rose-700">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-500" />
        <h3 className="text-base font-bold">Failed to load problem</h3>
        <p className="text-xs text-rose-600 mt-1">{error}</p>
        <Link
          to="/problems"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
        >
          Back to Problems
        </Link>
      </div>
    );
  }

  const activeVariant = problem.approaches?.find((a) => a.id === activeVariantId) || {};

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Link to="/problems" className="hover:text-blue-600 transition-colors font-medium">
            Problems
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold truncate max-w-xs">
            #{problem.problemNumber} {problem.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/problems/${problem._id}/edit`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Details</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Problem Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                #{problem.problemNumber}
              </span>
              <PlatformBadge
                platform={problem.platform}
                customPlatformName={problem.customPlatformName}
                size="md"
              />
              <DifficultyBadge difficulty={problem.difficulty} size="md" />

              {problem.problemUrl && (
                <a
                  href={problem.problemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline px-2 py-0.5"
                >
                  <span>Open on {problem.platform}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {problem.title}
            </h1>

            {/* Topics and Tags pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {problem.topics?.map((topic) => (
                <Link
                  key={topic}
                  to={`/problems?topic=${encodeURIComponent(topic)}`}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  {topic}
                </Link>
              ))}
              {problem.customTags?.map((tag) => (
                <Link
                  key={tag}
                  to={`/problems?topic=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                >
                  <TagIcon className="w-3 h-3 opacity-70" />
                  <span>#{tag}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Metrics & Revisit CTA */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <button
              type="button"
              onClick={() => setIsRevisitModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Mark as Revisited</span>
            </button>

            <div className="grid grid-cols-3 gap-4 text-left lg:text-right w-full sm:w-auto">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  First Solved
                </p>
                <p className="text-xs font-medium text-slate-700 mt-0.5">
                  {formatDate(problem.firstSolvedAt)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Last Reviewed
                </p>
                <p className="text-xs font-medium text-slate-700 mt-0.5">
                  {formatRelativeTime(problem.lastRevisitedAt)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Revisits
                </p>
                <p className="text-xs font-bold text-blue-600 mt-0.5">
                  {problem.revisitCount || 0} times
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Approach & Code Master Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-blue-600" />
              <span>Approaches & Code</span>
            </h2>
            <p className="text-xs text-slate-500">
              Select any tab to synchronously switch both the approach reasoning and implementation.
            </p>
          </div>

          {hasUnsavedVariantChanges && (
            <button
              type="button"
              onClick={handleSaveActiveVariant}
              disabled={isSavingVariant}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingVariant ? 'Saving...' : 'Save Approach Changes'}</span>
            </button>
          )}
        </div>

        {/* Master Synchronized Tabs Bar (Only showing variants for which something is typed, or active variant being edited) */}
        {(() => {
          const displayVariants = (problem.approaches || []).filter(
            (app) => isVariantFilled(app) || app.id === activeVariantId
          );
          const tabsToRender = displayVariants.length > 0 ? displayVariants : (problem.approaches || []);
          return (
            <SynchronizedVariantTabs
              variants={tabsToRender}
              activeVariantId={activeVariantId}
              onSelectVariant={handleSelectVariant}
              onAddVariant={handleAddVariant}
              onRenameVariant={handleRenameVariant}
              onDeleteVariant={handleDeleteVariant}
              sectionLabel="Selected Solution Variant"
              canEditStructure={true}
            />
          );
        })()}

        {/* Dual Layout: Approach Details & Code Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Approach Explanation & Complexity Box */}
          <div className="space-y-4">
            {/* Complexity Badges & Inputs */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Time Complexity
                </label>
                <input
                  type="text"
                  placeholder="e.g. O(N log N)"
                  value={currentTimeComplexity}
                  onChange={(e) => {
                    setCurrentTimeComplexity(e.target.value);
                    setHasUnsavedVariantChanges(true);
                  }}
                  className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Space Complexity
                </label>
                <input
                  type="text"
                  placeholder="e.g. O(1) or O(N)"
                  value={currentSpaceComplexity}
                  onChange={(e) => {
                    setCurrentSpaceComplexity(e.target.value);
                    setHasUnsavedVariantChanges(true);
                  }}
                  className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Approach Explanation textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>{activeVariant.name || 'Approach'} Explanation & Intuition</span>
                </label>
                <span className="text-[11px] text-slate-400">Preserves formatting</span>
              </div>
              <textarea
                rows={10}
                value={currentExplanation}
                onChange={(e) => {
                  setCurrentExplanation(e.target.value);
                  setHasUnsavedVariantChanges(true);
                }}
                placeholder="Explain the intuition behind this variant, step-by-step logic, base cases, and why this time/space complexity is achieved..."
                className="w-full p-3.5 text-xs sm:text-sm font-sans rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors leading-relaxed resize-y"
              />
            </div>

            {/* Variant Observations / Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Observations & Tradeoffs <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={currentNotes}
                onChange={(e) => {
                  setCurrentNotes(e.target.value);
                  setHasUnsavedVariantChanges(true);
                }}
                placeholder="Key observations for this variant, pros/cons compared to other variants..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500 resize-y"
              />
            </div>
          </div>

          {/* Synchronized Code Editor Box */}
          <div className="space-y-2">
            <CodeEditor
              code={currentCode}
              language={currentLanguage}
              onChangeCode={(newCode) => {
                setCurrentCode(newCode);
                setHasUnsavedVariantChanges(true);
              }}
              onChangeLanguage={(newLang) => {
                setCurrentLanguage(newLang);
                setHasUnsavedVariantChanges(true);
              }}
              onSave={handleSaveActiveVariant}
              isSaving={isSavingVariant}
              hasUnsavedChanges={hasUnsavedVariantChanges}
              minHeight="420px"
            />
          </div>
        </div>
      </div>

      {/* Confusion & Mistakes Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Confusion, Mistakes & Edge Cases
              </h3>
              <p className="text-xs text-slate-500">
                Record why initial ideas failed, edge cases missed, and what to remember when revising.
              </p>
            </div>
          </div>

          <div>
            {isEditingConfusion ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfusionText(problem.confusionNotes || '');
                    setIsEditingConfusion(false);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfusion}
                  disabled={isSavingConfusion}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Save className="w-3 h-3" />
                  <span>{isSavingConfusion ? 'Saving...' : 'Save Notes'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingConfusion(true)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                Edit Confusion Notes
              </button>
            )}
          </div>
        </div>

        {isEditingConfusion ? (
          <textarea
            rows={6}
            value={confusionText}
            onChange={(e) => setConfusionText(e.target.value)}
            placeholder={`• What confused me:\n• Why my initial idea failed:\n• Edge cases I missed:\n• Mistakes made while coding:\n• What I need to remember when revisiting:`}
            className="w-full p-4 text-xs sm:text-sm font-mono rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors leading-relaxed"
          />
        ) : (
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {problem.confusionNotes ? (
              problem.confusionNotes
            ) : (
              <span className="text-slate-400 italic">
                No confusion notes recorded yet. Click "Edit Confusion Notes" to record what challenged you or edge cases you missed.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Revision History Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Revision History ({problem.revisionHistory?.length || 0})
              </h3>
              <p className="text-xs text-slate-500">
                Chronological log of deliberate review sessions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRevisitModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mark as Revisited</span>
          </button>
        </div>

        {(!problem.revisionHistory || problem.revisionHistory.length === 0) ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No revisions logged yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              First solved on {formatDate(problem.firstSolvedAt, true)}. Click "Mark as Revisited" after reviewing this problem.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {problem.revisionHistory.map((rev, index) => (
              <div key={rev.id || index} className="relative group">
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold text-slate-800">
                      Revision #{problem.revisionHistory.length - index}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {formatDate(rev.timestamp, true)} ({formatRelativeTime(rev.timestamp)})
                    </span>
                  </div>

                  {rev.variantReviewed && (
                    <div className="mb-2">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Variant: {rev.variantReviewed}
                      </span>
                    </div>
                  )}

                  {rev.notes ? (
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {rev.notes}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No notes attached.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revisit Modal */}
      <RevisitModal
        isOpen={isRevisitModalOpen}
        problem={problem}
        isSubmitting={isSubmittingRevisit}
        onClose={() => setIsRevisitModalOpen(false)}
        onConfirm={handleRecordRevisit}
      />

      {/* Delete Problem Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title={`Delete "${problem.title}"?`}
        message={`Are you sure you want to delete problem #${problem.problemNumber} (${problem.title})? This action cannot be undone.`}
        confirmText="Delete Problem"
        isDeleting={isDeleting}
        onConfirm={handleDeleteProblem}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
