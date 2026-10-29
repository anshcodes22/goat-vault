import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  HelpCircle,
  Code2,
  FileText,
  AlertCircle,
  ExternalLink,
  Layers,
  Calendar,
  Sparkles
} from 'lucide-react';
import { problemService } from '../services/api';
import { TopicSelector } from '../components/TopicSelector';
import { SynchronizedVariantTabs } from '../components/SynchronizedVariantTabs';
import { CodeEditor } from '../components/CodeEditor';
import {
  SUPPORTED_PLATFORMS,
  SUPPORTED_LANGUAGES,
  isVariantFilled,
  getFilledVariants
} from '../utils/helpers';

export const AddEditProblemPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  // Basic Details state
  const [title, setTitle] = useState('');
  const [problemNumber, setProblemNumber] = useState('');
  const [platform, setPlatform] = useState('LeetCode');
  const [customPlatformName, setCustomPlatformName] = useState('');
  const [problemUrl, setProblemUrl] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [language, setLanguage] = useState('C++');
  const [firstSolveStatus, setFirstSolveStatus] = useState('');
  const [firstSolvedAt, setFirstSolvedAt] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Topics & Custom Tags
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedCustomTags, setSelectedCustomTags] = useState([]);

  // Confusion Notes
  const [confusionNotes, setConfusionNotes] = useState('');

  // Approach Variants
  const [approaches, setApproaches] = useState([
    {
      id: 'var-1',
      name: 'Brute Force',
      explanation: '',
      code: '',
      language: 'C++',
      timeComplexity: '',
      spaceComplexity: '',
      notes: ''
    },
    {
      id: 'var-2',
      name: 'Better',
      explanation: '',
      code: '',
      language: 'C++',
      timeComplexity: '',
      spaceComplexity: '',
      notes: ''
    },
    {
      id: 'var-3',
      name: 'Optimal',
      explanation: '',
      code: '',
      language: 'C++',
      timeComplexity: '',
      spaceComplexity: '',
      notes: ''
    }
  ]);
  const [activeVariantId, setActiveVariantId] = useState('var-1');

  // Form submission & loading states
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Load problem details if in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const loadProblem = async () => {
      try {
        setLoading(true);
        const res = await problemService.getProblemById(id);
        if (res.success && res.problem) {
          const p = res.problem;
          setTitle(p.title || '');
          setProblemNumber(p.problemNumber || '');
          setPlatform(p.platform || 'LeetCode');
          setCustomPlatformName(p.customPlatformName || '');
          setProblemUrl(p.problemUrl || '');
          setDifficulty(p.difficulty || 'Medium');
          setLanguage(p.language || 'C++');
          setFirstSolveStatus(p.firstSolveStatus || '');
          if (p.firstSolvedAt) {
            setFirstSolvedAt(new Date(p.firstSolvedAt).toISOString().split('T')[0]);
          }
          setSelectedTopics(p.topics || []);
          setSelectedCustomTags(p.customTags || []);
          setConfusionNotes(p.confusionNotes || '');

          if (p.approaches && p.approaches.length > 0) {
            const filled = p.approaches.filter(isVariantFilled);
            const toSet = filled.length > 0 ? filled : [p.approaches[0]];
            setApproaches(toSet);
            setActiveVariantId(toSet[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading problem for edit:', err);
        setErrorMessage('Failed to load problem data.');
      } finally {
        setLoading(false);
      }
    };

    loadProblem();
  }, [id, isEditMode]);

  // Handle active variant fields change
  const updateActiveVariant = (field, value) => {
    setApproaches((prev) =>
      prev.map((app) => (app.id === activeVariantId ? { ...app, [field]: value } : app))
    );
  };

  const handleAddVariant = (name) => {
    const newVariant = {
      id: `var-${Date.now()}`,
      name,
      explanation: '',
      code: '',
      language: language || 'C++',
      timeComplexity: '',
      spaceComplexity: '',
      notes: ''
    };
    setApproaches((prev) => [...prev, newVariant]);
    setActiveVariantId(newVariant.id);
  };

  const handleRenameVariant = (variantId, newName) => {
    setApproaches((prev) =>
      prev.map((app) => (app.id === variantId ? { ...app, name: newName } : app))
    );
  };

  const handleDeleteVariant = (variantId) => {
    if (approaches.length <= 1) return;
    const remaining = approaches.filter((app) => app.id !== variantId);
    setApproaches(remaining);
    if (activeVariantId === variantId) {
      setActiveVariantId(remaining[0].id);
    }
  };

  // Submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Problem title is required.');
      return;
    }
    if (!problemNumber.toString().trim()) {
      setErrorMessage('Question number / identifier is required.');
      return;
    }
    if (platform === 'Other' && !customPlatformName.trim()) {
      setErrorMessage('Custom platform name is required when platform is Other.');
      return;
    }

    try {
      setSubmitting(true);
      // Only save variants for which something was typed
      const filledApproaches = approaches.filter(isVariantFilled);
      const approachesToSave = filledApproaches.length > 0
        ? filledApproaches
        : [approaches.find((a) => a.id === activeVariantId) || approaches[0]];

      const payload = {
        title: title.trim(),
        problemNumber: problemNumber.toString().trim(),
        platform,
        customPlatformName: platform === 'Other' ? customPlatformName.trim() : '',
        problemUrl: problemUrl.trim(),
        difficulty,
        topics: selectedTopics,
        customTags: selectedCustomTags,
        language,
        firstSolveStatus: firstSolveStatus.trim(),
        firstSolvedAt: new Date(firstSolvedAt),
        confusionNotes,
        approaches: approachesToSave
      };

      let res;
      if (isEditMode) {
        res = await problemService.updateProblem(id, payload);
      } else {
        res = await problemService.createProblem(payload);
      }

      if (res.success && res.problem) {
        navigate(`/problems/${res.problem._id}`);
      }
    } catch (err) {
      console.error('Error saving problem:', err);
      const msg = err.response?.data?.message || 'Failed to save problem. Please check input values.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-xl border border-slate-200" />
        <div className="h-96 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  const activeVariant = approaches.find((a) => a.id === activeVariantId) || approaches[0] || {};

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEditMode ? 'Edit Problem' : 'Add New Problem'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditMode
                ? 'Update problem parameters, approaches, code, and confusion observations.'
                : 'Save problem details, multiple synchronized approaches, and confusion notes.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? 'Saving Problem...' : isEditMode ? 'Update Problem' : 'Save Problem'}</span>
        </button>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-800 text-xs sm:text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">1. Problem Information</h2>
            <p className="text-xs text-slate-500">Identifiers, source platform, difficulty and primary language.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Problem Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Problem Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Trapping Rain Water, Two Sum"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Question Number / Identifier */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Question Identifier / Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1, 42, 123A, CSES-1068"
                value={problemNumber}
                onChange={(e) => setProblemNumber(e.target.value)}
                className="w-full text-sm font-mono rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Platform */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Platform <span className="text-rose-500">*</span>
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {SUPPORTED_PLATFORMS.map((plat) => (
                  <option key={plat} value={plat}>
                    {plat}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Platform Name (if Other) */}
            {platform === 'Other' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Custom Platform Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HackerRank, SPOJ"
                  value={customPlatformName}
                  onChange={(e) => setCustomPlatformName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            {/* Default Programming Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Language
              </label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  // Also set active variant language if not yet customized
                  updateActiveVariant('language', e.target.value);
                }}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* First Solved Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>First Solved Date</span>
              </label>
              <input
                type="date"
                value={firstSolvedAt}
                onChange={(e) => setFirstSolvedAt(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Problem URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Problem URL <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://leetcode.com/problems/trapping-rain-water/"
              value={problemUrl}
              onChange={(e) => setProblemUrl(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* First Solve Status / Self-Assessment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Did you figure it out on first solve?</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Self assessment (optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Solved independently without hints, Needed a hint on Kadane base case, Looked at solution after 25 mins..."
              value={firstSolveStatus}
              onChange={(e) => setFirstSolveStatus(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Section 2: Topics and Custom Tags */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">2. Topics & Custom Tags</h2>
            <p className="text-xs text-slate-500">
              Select predefined algorithms/data structure tags or create reusable custom tags (e.g. #Blind75, #StriverSDE).
            </p>
          </div>

          <TopicSelector
            selectedTopics={selectedTopics}
            selectedCustomTags={selectedCustomTags}
            onChangeTopics={setSelectedTopics}
            onChangeCustomTags={setSelectedCustomTags}
          />
        </div>

        {/* Section 3: Approaches & Code (Synchronized!) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-blue-600" />
              <span>3. Approaches & Code</span>
            </h2>
            <p className="text-xs text-slate-500">
              Maintain separate logic, time & space complexities, and implementation for each approach. Tabs stay synchronized!
            </p>
          </div>

          {/* Synchronized Tabs Bar */}
          <SynchronizedVariantTabs
            variants={approaches}
            activeVariantId={activeVariantId}
            onSelectVariant={setActiveVariantId}
            onAddVariant={handleAddVariant}
            onRenameVariant={handleRenameVariant}
            onDeleteVariant={handleDeleteVariant}
            sectionLabel="Editing Variant"
            canEditStructure={true}
          />

          {/* Dual Layout for Current Variant */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Complexities & Explanation */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Time Complexity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. O(N)"
                    value={activeVariant.timeComplexity || ''}
                    onChange={(e) => updateActiveVariant('timeComplexity', e.target.value)}
                    className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Space Complexity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. O(1)"
                    value={activeVariant.spaceComplexity || ''}
                    onChange={(e) => updateActiveVariant('spaceComplexity', e.target.value)}
                    className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Approach Intuition & Explanation
                </label>
                <textarea
                  rows={9}
                  value={activeVariant.explanation || ''}
                  onChange={(e) => updateActiveVariant('explanation', e.target.value)}
                  placeholder={`Detail the logic for "${activeVariant.name}":\n• Core idea and intuition\n• Key invariants or pointers\n• Why this complexity is achieved`}
                  className="w-full p-3.5 text-xs sm:text-sm font-sans rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors leading-relaxed resize-y"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Variant Notes & Observations <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={activeVariant.notes || ''}
                  onChange={(e) => updateActiveVariant('notes', e.target.value)}
                  placeholder="Additional notes, tradeoffs, or observations..."
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>
            </div>

            {/* Right: Code Editor */}
            <div className="space-y-2">
              <CodeEditor
                code={activeVariant.code || ''}
                language={activeVariant.language || language || 'C++'}
                onChangeCode={(newCode) => updateActiveVariant('code', newCode)}
                onChangeLanguage={(newLang) => updateActiveVariant('language', newLang)}
                minHeight="390px"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Confusion, Mistakes & Edge Cases */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900">4. Confusion & Mistakes Section</h2>
              <p className="text-xs text-slate-500">Record your thought traps, edge cases, and what tripped you up.</p>
            </div>
          </div>

          <textarea
            rows={5}
            value={confusionNotes}
            onChange={(e) => setConfusionNotes(e.target.value)}
            placeholder={`• What confused me:\n• Why my initial idea failed:\n• Edge cases I missed:\n• Mistakes made while coding:\n• What I need to remember when revisiting:`}
            className="w-full p-4 text-xs sm:text-sm font-mono rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors leading-relaxed"
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to={isEditMode ? `/problems/${id}` : '/problems'}
            className="px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEditMode ? 'Update Problem' : 'Save Problem'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
